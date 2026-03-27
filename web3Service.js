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
  
  await forceBSC();
  
  provider = new ethers.BrowserProvider(window.ethereum);
  signer = await provider.getSigner();
  
  const code = await provider.getCode(PROXY_ADDRESS);
  if (code === "0x" || code === "0x0") {
    throw new Error("Contract not found on this network. Please check your network settings.");
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
      referrals = Number(await contract.getReferralCount(address));
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
  let fetchContract = contract;
  if (!fetchContract) {
    for (const rpc of BSC_RPC_URLS) {
      try {
        const readProvider = new ethers.JsonRpcProvider(rpc);
        fetchContract = new ethers.Contract(PROXY_ADDRESS, ABI, readProvider);
        break;
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!fetchContract) return;

  try {
    const [addresses, counts] = await fetchContract.getTopReferrers();
    const detailedData = addresses.map((addr, index) => ({
      address: addr,
      referrals: Number(counts[index])
    })).filter(item => item.address !== ethers.ZeroAddress);

    if (window.renderLeaderboard) {
      window.renderLeaderboard(detailedData);
    }
    return detailedData;
  } catch (err) {
    console.error("Leaderboard fetch failed:", err.message);
  }
}

export async function buyPresale(amountBNB) {
  const { contract } = await getWeb3State();
  const referralAddress = localStorage.getItem("aigods_referrer") || zeroAddress;
  
  const tx = await contract.buyPreSale(referralAddress, {
    value: ethers.parseEther(amountBNB.toString())
  });
  
  await tx.wait();
  await updateBalances();
  await loadLeaderboard();
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
