import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/dist/ethers.min.js";

//////////////////////////////////////////////////
// CONFIG — AIGODS PROXY
//////////////////////////////////////////////////

const CONTRACT_ADDRESS = "0x90bA2e2E23155DB5c00aD99Dc30503fb760b7157";

const ABI = [
  "function buyPreSale(address referrer) payable",
  "function claimAirdrop() external",
  "function referrals(address user) view returns (uint256 referralCount, uint256 lastUpdated)",
  "function registerReferral(address referrer, address referee) external"
];

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyD-TLeC7XjRLQXPRgnkP4Bz7G8LUw3NLJM",
  authDomain: "aigod-s-coin-official.firebaseapp.com",
  projectId: "aigod-s-coin-official",
  storageBucket: "aigod-s-coin-official.firebasestorage.app",
  messagingSenderId: "847357583010",
  appId: "1:847357583010:web:325ee2979d3e8a026dc1fb",
  measurementId: "G-7KF108XF9X"
};

//////////////////////////////////////////////////
// FIREBASE INIT
//////////////////////////////////////////////////

let db;

async function initFirebase() {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"
  );

  const { getFirestore } = await import(
    "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
  );

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

//////////////////////////////////////////////////
// WALLET CONNECT
//////////////////////////////////////////////////

export async function connectWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or use a Web3 browser");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      signer
    );

    return { provider, signer, contract };
  } catch (err) {
    console.error("Connection error:", err);
    throw err;
  }
}

//////////////////////////////////////////////////
// REGISTER REFERRAL ON PURCHASE
//////////////////////////////////////////////////

export async function buyWithReferral(referrer, ethAmount) {
  try {
    const { contract } = await connectWallet();
    
    // Ensure referrer is a valid address, default to zero address if not
    const ref = (referrer && ethers.isAddress(referrer)) ? referrer : "0x0000000000000000000000000000000000000000";

    const tx = await contract.buyPreSale(
      ref,
      { value: ethers.parseEther(ethAmount.toString()) }
    );

    await tx.wait();

    alert("Purchase successful!");

    await updateDashboard();

  } catch (err) {
    console.error("Purchase error:", err);
    alert("Purchase failed: " + (err.reason || err.message || "Unknown error"));
  }
}

//////////////////////////////////////////////////
// FETCH USER REFERRALS
//////////////////////////////////////////////////

export async function getUserReferrals(address) {
  try {
    const { contract } = await connectWallet();
    const result = await contract.referrals(address);
    // result is [referralCount, lastUpdated]
    return Number(result[0]);
  } catch (err) {
    console.error("Error fetching referrals:", err);
    return 0;
  }
}

//////////////////////////////////////////////////
// AIRDROP CLAIM
//////////////////////////////////////////////////

export async function claimAirdrop() {
  try {
    const { contract } = await connectWallet();

    const tx = await contract.claimAirdrop();
    await tx.wait();

    alert("Airdrop claimed successfully!");

    await updateDashboard();

  } catch (err) {
    console.error("Airdrop error:", err);
    alert("Airdrop failed: " + (err.reason || err.message || "Already claimed or ineligible"));
  }
}

//////////////////////////////////////////////////
// DASHBOARD UPDATE
//////////////////////////////////////////////////

export async function updateDashboard() {
  try {
    const { signer } = await connectWallet();
    const user = await signer.getAddress();
    const referralsCount = await getUserReferrals(user);

    // Update UI element if it exists
    const refElement = document.getElementById("myReferrals");
    if (refElement) {
      refElement.innerText = referralsCount;
    }

    await syncLeaderboard(user, referralsCount);
  } catch (err) {
    console.error("Dashboard update error:", err);
  }
}

//////////////////////////////////////////////////
// FIREBASE LEADERBOARD SYNC
//////////////////////////////////////////////////

async function syncLeaderboard(user, referrals) {
  try {
    if (!db) await initFirebase();

    const { doc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"
    );

    await setDoc(
      doc(db, "leaderboard", user),
      { referrals: referrals, lastUpdated: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.error("Firebase sync error:", err);
  }
}

//////////////////////////////////////////////////
// ADD TOKEN TO WALLET
//////////////////////////////////////////////////

export async function addTokenToWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or use a Web3 browser");
    return;
  }

  const tokenAddress = CONTRACT_ADDRESS;
  const tokenSymbol = "AIGODS";
  const tokenDecimals = 18;
  const tokenImage = "https://via.placeholder.com/200";
  const targetChainId = "0x89"; // Polygon Mainnet (0x38 for BSC in future)

  try {
    // Check current network
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetChainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          // Chain not added, add it
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: targetChainId,
              chainName: "Polygon Mainnet",
              rpcUrls: ["https://polygon-rpc.com/"],
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              blockExplorerUrls: ["https://polygonscan.com/"]
            }]
          });
        } else {
          throw switchError;
        }
      }
    }

    // Request to add token
    const wasAdded = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
          image: tokenImage,
        },
      },
    });

    if (wasAdded) {
      alert("AIGODS COIN successfully added to your wallet!");
    } else {
      alert("Token addition was cancelled.");
    }
  } catch (err) {
    console.error("Add token error:", err);
    alert("Error adding token: " + (err.message || "Unknown error"));
  }
}
