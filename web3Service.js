import { ethers } from "ethers";
import { PROXY_CONTRACT_ADDRESS, CONTRACT_ABI, BSC_RPC_URLS, FIREBASE_CONFIG } from "./constants.ts";

const PROXY_ADDRESS = PROXY_CONTRACT_ADDRESS;
const ABI = CONTRACT_ABI;
const zeroAddress = "0x0000000000000000000000000000000000000000";

// Shared state
let provider = null;
let signer = null;
let contract = null;
let db = null;

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
  
  signer = await provider.getSigner();
  
  // 4. Verify network again after account access
  const network = await provider.getNetwork();
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
  try {
    const { provider, signer, contract } = await getWeb3State();
    const address = await signer.getAddress();
    
    console.log("Fetching balances for:", address);

    // Fetch Token Balance
    let tokenBal = "0.00";
    try {
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      tokenBal = ethers.formatUnits(balance, decimals);
    } catch (e) {
      console.warn("Token balance fetch failed:", e.message);
    }

    // Fetch BNB Balance
    let bnbBal = "0.00";
    try {
      const balanceBNB = await provider.getBalance(address);
      bnbBal = ethers.formatEther(balanceBNB);
    } catch (e) {
      console.warn("BNB balance fetch failed:", e.message);
    }
    
    // Format balances for display
    const formattedTokenBalance = isNaN(parseFloat(tokenBal)) ? "0.00" : parseFloat(tokenBal).toLocaleString(undefined, { maximumFractionDigits: 2 });
    const formattedBnbBalance = isNaN(parseFloat(bnbBal)) ? "0.0000" : parseFloat(bnbBal).toFixed(4);

    console.log("Balances updated:", { token: formattedTokenBalance, bnb: formattedBnbBalance });

    // Fetch referrals from contract if function exists
    let referrals = 0;
    try {
      // Note: getReferralCount is not in the current ABI, using fallback or 0
      // referrals = Number(await contract.getReferralCount(address));
    } catch (e) {
      // console.warn("getReferralCount not found in ABI");
    }

    // Sync with Firebase
    try {
      const firestore = await getDb();
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      await setDoc(doc(firestore, "leaderboard", address), {
        referrals: referrals,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      // console.warn("Firebase sync failed:", e.message);
    }

    // Dispatch event for React
    window.dispatchEvent(new CustomEvent('web3Update', { 
      detail: { 
        tokenBalance: formattedTokenBalance,
        bnbBalance: formattedBnbBalance,
        referrals: referrals,
        address: address
      } 
    }));
    
    return { balance: tokenBal, bnbBalance: bnbBal, referrals };
  } catch (e) {
    console.error("Balance update failed:", e.message);
    return { balance: "0.00", bnbBalance: "0.00", referrals: 0 };
  }
}

export async function loadLeaderboard() {
  // Note: getTopReferrers is not in the current ABI, returning empty list
  console.warn("getTopReferrers not found in ABI, leaderboard disabled");
  if (window.renderLeaderboard) {
    window.renderLeaderboard([]);
  }
  return [];
}

export async function buyPresale(amountBNB) {
  try {
    const { contract } = await getWeb3State();
    const referralAddress = localStorage.getItem("aigods_referrer") || zeroAddress;
    
    console.log("Initiating buyPresale with amount:", amountBNB, "and referral:", referralAddress);
    
    const value = ethers.parseEther(amountBNB.toString());
    
    // Estimate gas for better reliability
    let gasLimit;
    try {
      gasLimit = await contract.buyTokensWithReferral.estimateGas(referralAddress, { value });
      // Add 20% buffer
      gasLimit = (gasLimit * 120n) / 100n;
    } catch (e) {
      console.warn("Gas estimation failed, using default:", e.message);
      gasLimit = 300000n;
    }

    const tx = await contract.buyTokensWithReferral(referralAddress, {
      value,
      gasLimit
    });
    
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Transaction confirmed");
    
    await updateBalances();
    return tx;
  } catch (err) {
    console.error("buyPresale failed:", err);
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
    
    const routerAddress = await contract.QUICKSWAP_ROUTER();
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
