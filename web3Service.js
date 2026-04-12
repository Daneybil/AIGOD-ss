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
      // Verify connection is still active
      await signer.getAddress();
      return { provider, signer, contract };
    } catch (e) {
      // Re-initialize if stale
      provider = null;
      signer = null;
      contract = null;
    }
  }
  
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask or use Trust Wallet.");
  }
  
  // Request account access explicitly for better compatibility
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
  } catch (err) {
    if (err.code === 4001) {
      throw new Error("Connection request was rejected. Please connect your wallet to proceed.");
    }
    throw err;
  }
  
  // Ensure we are on BSC
  await forceBSC();
  
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  
  // Verify contract existence
  let code = "0x";
  try {
    code = await provider.getCode(PROXY_ADDRESS);
  } catch (err) {
    console.warn("getCode failed, trying fallback:", err.message);
    try {
      const fallbackProvider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      code = await fallbackProvider.getCode(PROXY_ADDRESS);
    } catch (fallbackErr) {
      console.error("Fallback check failed:", fallbackErr);
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
    const { signer, contract } = await getWeb3State();
    const address = await signer.getAddress();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    
    // Fetch referrals from contract if function exists
    let referrals = 0;
    try {
      // Note: getReferralCount is not in the current ABI, using fallback or 0
      // referrals = Number(await contract.getReferralCount(address));
    } catch (e) {
      console.warn("getReferralCount not found in ABI");
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
      console.warn("Firebase sync failed:", e.message);
    }

    // Dispatch event for React
    window.dispatchEvent(new CustomEvent('web3Update', { 
      detail: { 
        tokenBalance: parseFloat(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        referrals: referrals,
        address: address
      } 
    }));
    
    return { balance: formatted, referrals };
  } catch (e) {
    console.error("Balance update failed:", e.message);
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
  const { contract } = await getWeb3State();
  const referralAddress = localStorage.getItem("aigods_referrer") || zeroAddress;
  
  // Using buyTokensWithReferral as per ABI
  const tx = await contract.buyTokensWithReferral(referralAddress, {
    value: ethers.parseEther(amountBNB.toString())
  });
  
  await tx.wait();
  await updateBalances();
  // await loadLeaderboard();
  return tx;
}

export async function claimAirdrop() {
  const { contract } = await getWeb3State();
  const tx = await contract.claimAirdrop();
  await tx.wait();
  await updateBalances();
  await loadLeaderboard();
  return tx;
}
