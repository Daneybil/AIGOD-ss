import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.10.0/dist/ethers.min.js";

//////////////////////////////////////////////////
// CONFIG — AIGODS PROXY
//////////////////////////////////////////////////

const CONTRACT_ADDRESS = "0xb0999Bc622085c1C2031D1aDFfe2096EB5Aafda1";

const ABI = [
  "function buyPreSale(address referrer) payable",
  "function claimAirdrop() external",
  "function getReferralCount(address user) view returns (uint256)",
  "function hasClaimedAirdrop(address user) view returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
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
    const count = await contract.getReferralCount(address);
    return Number(count);
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
    const { contract, signer } = await connectWallet();
    const userAddress = await signer.getAddress();

    // Check if already claimed
    const hasClaimed = await contract.hasClaimedAirdrop(userAddress);
    if (hasClaimed) {
      alert("You have already claimed your airdrop!");
      return;
    }

    const tx = await contract.claimAirdrop();
    alert("Transaction sent... Waiting for confirmation.");
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
    const { signer, contract } = await connectWallet();
    const user = await signer.getAddress();
    
    // Fetch referrals
    const referralsCount = await getUserReferrals(user);

    // Fetch balance
    const balance = await contract.balanceOf(user);
    const decimals = await contract.decimals();
    const formattedBalance = ethers.formatUnits(balance, decimals);

    // Update UI elements if they exist
    const refElement = document.getElementById("myReferrals");
    if (refElement) {
      refElement.innerText = referralsCount;
    }

    const balanceElement = document.getElementById("userTokenBalance");
    if (balanceElement) {
      balanceElement.innerText = parseFloat(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    // Dispatch event for React state sync
    window.dispatchEvent(new CustomEvent('web3Update', { 
      detail: { 
        tokenBalance: parseFloat(formattedBalance).toLocaleString(undefined, { maximumFractionDigits: 2 }),
        referrals: referralsCount
      } 
    }));

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
