import { ethers } from "ethers";
import { 
  PROXY_CONTRACT_ADDRESS, 
  CONTRACT_ABI, 
  BSC_RPC_URLS, 
  FIREBASE_CONFIG, 
  PRESALE_ROUTER_ADDRESS, 
  PRESALE_ROUTER_ABI 
} from "./constants.ts";

const PROXY_ADDRESS = PROXY_CONTRACT_ADDRESS;
const ABI = CONTRACT_ABI;
const zeroAddress = "0x0000000000000000000000000000000000000000";

// Shared state
let provider = null;
let signer = null;
let contract = null;
let db = null;
let connectedAddress = null;

// Caching system
const cache = {
  balances: { data: null, timestamp: 0 },
  bnbPrice: { data: null, timestamp: 0 },
  leaderboard: { data: null, timestamp: 0 },
  CACHE_DURATION: 20000 // 20 seconds
};

// Public state for reading (more stable than wallet provider)
let publicProvider = null;
let publicContract = null;

// Optimized Public Provider with better retry logic and reliable endpoints
async function getPublicState() {
  if (publicProvider && publicContract) return { publicProvider, publicContract };
  
  const robustRPCs = [
    "https://binance.llamarpc.com",
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://rpc.ankr.com/bsc"
  ];

  for (const rpc of robustRPCs) {
    try {
      const tempProvider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      // Quick ping
      await Promise.race([
        tempProvider.getBlockNumber(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
      ]);
      publicProvider = tempProvider;
      publicContract = new ethers.Contract(PROXY_ADDRESS, ABI, publicProvider);
      return { publicProvider, publicContract };
    } catch (e) {
      console.warn(`Public RPC ${rpc} check failed:`, e.message);
    }
  }
  
  // Fallback to constants if all robust fail
  for (const rpc of BSC_RPC_URLS) {
    try {
      publicProvider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
      await publicProvider.getBlockNumber();
      publicContract = new ethers.Contract(PROXY_ADDRESS, ABI, publicProvider);
      return { publicProvider, publicContract };
    } catch (e) {}
  }

  throw new Error("Unable to connect to Binance Smart Chain. Please check your connection.");
}

// Initialize Firebase lazily
async function getDb() {
  if (db) return db;
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
  return db;
}

export async function forceBSC() {
  if (!window.ethereum) throw new Error("No crypto wallet found. Please install MetaMask or Trust Wallet.");
  
  const chainId = "0x38"; // BSC Mainnet
  const chainConfig = {
    chainId,
    chainName: "Binance Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"]
  };

  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId === chainId) return;
    
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }]
      });
    } catch (switchError) {
      // Error code 4902 means the chain has not been added
      if (switchError.code === 4902 || (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902)) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [chainConfig]
        });
      } else {
        throw switchError;
      }
    }
  } catch (err) {
    console.error("Network switch failed:", err);
    throw new Error("Please switch your wallet network to Binance Smart Chain (BSC).");
  }
}

export async function getBNBPrice() {
  const now = Date.now();
  if (cache.bnbPrice.data && (now - cache.bnbPrice.timestamp < cache.CACHE_DURATION)) {
    return cache.bnbPrice.data;
  }

  const fetchPrice = async () => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT");
      const data = await response.json();
      return parseFloat(data.price);
    } catch (e) {
      const responseCoingecko = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd");
      const dataCoingecko = await responseCoingecko.json();
      return dataCoingecko.binancecoin.usd;
    }
  };

  try {
    const price = await fetchPrice();
    cache.bnbPrice = { data: price, timestamp: now };
    return price;
  } catch (err) {
    return cache.bnbPrice.data || 600;
  }
}

export async function getWeb3State() {
  if (provider && signer && contract) {
    try {
      // Verify connection is still active and on correct network
      const network = await provider.getNetwork();
      if (Number(network.chainId) === 56) {
        await signer.getAddress();
        return { provider, signer, contract };
      }
    } catch (e) {
      // Re-initialize if stale or wrong network
      provider = null;
      signer = null;
      contract = null;
    }
  }
  
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask or use Trust Wallet.");
  }
  
  // 1. Ensure we are on BSC FIRST before initializing provider to prevent "Failed to fetch"
  try {
    await forceBSC();
  } catch (err) {
    console.warn("forceBSC failed, but attempting to proceed:", err.message);
  }
  
  // 2. Initialize provider with 'any' network to handle network changes gracefully
  // and prevent the 'could not coalesce error' during initialization
  provider = new ethers.BrowserProvider(window.ethereum, "any");
  
  // 3. Request account access explicitly
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (err) {
    if (err.code === 4001) {
      throw new Error("Connection request was rejected. Please connect your wallet to proceed.");
    }
    throw err;
  }
  
  // Add a small delay to allow the provider to stabilize
  await new Promise(resolve => setTimeout(resolve, 500));
  
  signer = await provider.getSigner();
  connectedAddress = await signer.getAddress();
  
  // 4. Verify network again after account access with retry
  let network;
  for (let i = 0; i < 3; i++) {
    try {
      network = await provider.getNetwork();
      break;
    } catch (e) {
      if (i === 2) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (Number(network.chainId) !== 56) {
    console.warn("Provider is not on BSC (Chain ID 56). Current Chain ID:", network.chainId);
    // Try one last time to switch if network is wrong
    try { await forceBSC(); } catch (e) {}
  }

  // 5. Verify contract existence with fallback RPC resilience
  let code = "0x";
  try {
    code = await provider.getCode(PROXY_ADDRESS);
  } catch (err) {
    console.warn("getCode failed on wallet provider, trying fallback RPCs:", err.message);
    // Iterate through fallback RPCs from constants
    for (const rpc of BSC_RPC_URLS) {
      try {
        const fallbackProvider = new ethers.JsonRpcProvider(rpc);
        code = await fallbackProvider.getCode(PROXY_ADDRESS);
        if (code !== "0x" && code !== "0x0") break;
      } catch (fallbackErr) {}
    }
  }

  if (code === "0x" || code === "0x0") {
    console.warn("Contract not found at address on current network:", PROXY_ADDRESS);
  }
  
  contract = new ethers.Contract(PROXY_ADDRESS, ABI, signer);
  return { provider, signer, contract };
}

export async function updateBalances() {
  const now = Date.now();
  
  try {
    let address = connectedAddress;
    if (!address && window.ethereum && window.ethereum.selectedAddress) {
      address = window.ethereum.selectedAddress;
      connectedAddress = address;
    }
    
    // Check cache for this specific address
    if (address && cache.balances.data && cache.balances.data.address === address && (now - cache.balances.timestamp < cache.CACHE_DURATION)) {
      return cache.balances.data;
    }

    if (!address) {
       // Avoid recursive calls or heavy init on boot
       return { balance: "0.00", bnbBalance: "0.00", referrals: 0 };
    }

    const { publicProvider, publicContract } = await getPublicState();
    
    // Batch calls using Promise.all
    const [balance, decimals, bnbBalRaw, refRaw] = await Promise.all([
      publicContract.balanceOf(address).catch(() => 0n),
      publicContract.decimals().catch(() => 18n),
      publicProvider.getBalance(address).catch(() => 0n),
      publicContract.getReferralCount(address).catch(() => 0n)
    ]);

    const tokenBal = ethers.formatUnits(balance, decimals);
    const bnbBal = ethers.formatEther(bnbBalRaw);
    const referrals = Number(refRaw);
    
    const formattedTokenBalance = isNaN(parseFloat(tokenBal)) ? "0.00" : parseFloat(tokenBal).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedBnbBalance = isNaN(parseFloat(bnbBal)) ? "0.0000" : parseFloat(bnbBal).toFixed(4);

    const result = { balance: tokenBal, bnbBalance: bnbBal, referrals, address };
    cache.balances = { data: result, timestamp: now };

    // Async sync with Firebase (don't block UI)
    setTimeout(async () => {
      try {
        const firestore = await getDb();
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        await setDoc(doc(firestore, "leaderboard", address), {
          referrals: referrals,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}
    }, 0);

    window.dispatchEvent(new CustomEvent('web3Update', { 
      detail: { 
        tokenBalance: formattedTokenBalance,
        bnbBalance: formattedBnbBalance,
        referrals: referrals,
        address: address
      } 
    }));
    
    return result;
  } catch (e) {
    console.error("Balance update failed:", e.message);
    return cache.balances.data || { balance: "0.00", bnbBalance: "0.00", referrals: 0 };
  }
}

export async function loadLeaderboard() {
  const now = Date.now();
  if (cache.leaderboard.data && (now - cache.leaderboard.timestamp < cache.CACHE_DURATION)) {
    if (window.renderLeaderboard) window.renderLeaderboard(cache.leaderboard.data);
    return cache.leaderboard.data;
  }

  try {
    const { publicContract } = await getPublicState();
    const [addresses, counts] = await publicContract.getTopReferrers();
    
    const leaderboard = addresses.map((addr, i) => ({
      address: addr,
      referrals: Number(counts[i])
    })).filter(item => item.address !== zeroAddress);

    cache.leaderboard = { data: leaderboard, timestamp: now };

    if (window.renderLeaderboard) {
      window.renderLeaderboard(leaderboard);
    }
    return leaderboard;
  } catch (e) {
    console.error("loadLeaderboard failed:", e.message);
    if (window.renderLeaderboard) {
      window.renderLeaderboard(cache.leaderboard.data || []);
    }
    return cache.leaderboard.data || [];
  }
}

export async function buyPresale(amountBNB) {
  try {
    const { signer } = await getWeb3State();
    const routerContract = new ethers.Contract(PRESALE_ROUTER_ADDRESS, PRESALE_ROUTER_ABI, signer);
    const referralAddress = localStorage.getItem("aigods_referrer") || zeroAddress;
    
    console.log("Initiating buy via PresaleRouter with amount:", amountBNB, "and referral:", referralAddress);
    
    const value = ethers.parseEther(amountBNB.toString());
    
    // Estimate gas for better reliability
    let gasLimit;
    try {
      gasLimit = await routerContract.buy.estimateGas(referralAddress, { value });
      // Add 20% buffer
      gasLimit = (gasLimit * 120n) / 100n;
    } catch (e) {
      console.warn("Gas estimation failed on router, using default:", e.message);
      gasLimit = 300000n;
    }

    const tx = await routerContract.buy(referralAddress, {
      value,
      gasLimit
    });
    
    console.log("Router transaction sent:", tx.hash);
    await tx.wait();
    console.log("Router transaction confirmed");
    
    await updateBalances();
    return tx;
  } catch (err) {
    console.error("buyPresale via router failed:", err);
    throw err;
  }
}

export async function claimAirdrop() {
  try {
    const { contract } = await getWeb3State();
    
    console.log("Initiating claimAirdrop");
    
    // Estimate gas
    let gasLimit;
    try {
      gasLimit = await contract.claimAirdrop.estimateGas();
      gasLimit = (gasLimit * 120n) / 100n;
    } catch (e) {
      console.warn("Gas estimation failed, using default:", e.message);
      gasLimit = 200000n;
    }

    const tx = await contract.claimAirdrop({ gasLimit });
    
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed");
    
    await updateBalances();
    // await loadLeaderboard();
    return tx;
  } catch (err) {
    console.error("claimAirdrop failed:", err);
    throw err;
  }
}

export async function sellTokens(amountTokens) {
  try {
    const { contract, signer, provider } = await getWeb3State();
    const address = await signer.getAddress();
    
    console.log("Initiating sellTokens with amount:", amountTokens);
    
    const routerAddress = await contract.PANCAKE_ROUTER();
    if (!routerAddress || routerAddress === zeroAddress) {
      throw new Error("Router address not found in contract.");
    }
    
    const decimals = await contract.decimals();
    const amount = ethers.parseUnits(amountTokens.toString(), decimals);
    
    // 1. Approve Router
    console.log("Approving router...");
    const approveTx = await contract.approve(routerAddress, amount);
    await approveTx.wait();
    console.log("Router approved");
    
    // 2. Swap via Router
    const routerAbi = [
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
    ];
    const router = new ethers.Contract(routerAddress, routerAbi, signer);
    
    const WETH = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"; // WBNB on BSC
    const path = [PROXY_ADDRESS, WETH];
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    console.log("Swapping tokens for BNB...");
    const swapTx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amount,
      0, // amountOutMin (0 for simplicity, ideally should be calculated with slippage)
      path,
      address,
      deadline
    );
    
    console.log("Swap transaction sent:", swapTx.hash);
    await swapTx.wait();
    console.log("Swap confirmed");
    
    await updateBalances();
    return swapTx;
  } catch (err) {
    console.error("sellTokens failed:", err);
    throw err;
  }
}
