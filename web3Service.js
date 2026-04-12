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
  if (!window.ethereum) throw new Error("No wallet found");
  const chainId = "0x38"; // BSC Mainnet
  try {
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId === chainId) return;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId,
          chainName: "Binance Smart Chain",
          nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          rpcUrls: BSC_RPC_URLS,
          blockExplorerUrls: ["https://bscscan.com"]
        }]
      });
    } else {
      throw switchError;
    }
  }
}

export async function getWeb3State() {
  if (provider && signer && contract) {
    return { provider, signer, contract };
  }
  
  if (!window.ethereum) throw new Error("No crypto wallet found");
  
  try {
    await forceBSC();
  } catch (bscErr) {
    console.warn("forceBSC failed or was cancelled:", bscErr.message);
    // Continue anyway, as the user might already be on the right network or wants to try
  }
  
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  
  let code;
  try {
    code = await provider.getCode(PROXY_ADDRESS);
  } catch (err) {
    console.warn("getCode failed, trying fallback RPC:", err.message);
    // Fallback to check if contract exists via public RPC if wallet provider fails
    try {
      const fallbackProvider = new ethers.JsonRpcProvider(BSC_RPC_URLS[0]);
      code = await fallbackProvider.getCode(PROXY_ADDRESS);
    } catch (fallbackErr) {
      throw new Error("Network connection error. Please ensure you are on Binance Smart Chain and have a stable internet connection.");
    }
  }

  if (code === "0x" || code === "0x0") {
    throw new Error("Contract not found on this network. Please ensure your wallet is connected to Binance Smart Chain (BSC).");
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
