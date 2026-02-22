import { ethers } from "https://esm.sh/ethers@6.13.5";
import { forcePolygon, safeContractCall } from "./polygonFix.js";

//////////////////////////////////////////////////
// CONFIG — AIGODS PROXY
//////////////////////////////////////////////////

const PROXY_ADDRESS = "0xb0999Bc622085c1C2031D1aDFfe2096EB5Aafda1";

const ABI = [
  "function buyPreSale(address referrer) payable",
  "function claimAirdrop() external",
  "function getTopReferrers() view returns (address[], uint256[])",
  "function getReferralCount(address user) view returns (uint256)",
  "function hasClaimedAirdrop(address user) view returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

let provider = null;
let signer = null;
let contract = null;

export async function connectWallet() {
  if (!window.ethereum) {
    alert("MetaMask is required.");
    return;
  }
  
  await forcePolygon();
  
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(PROXY_ADDRESS, ABI, signer);
    const address = await signer.getAddress();
    await autoRegisterReferral(address);
    await loadLeaderboard();
    return address;
  } catch (err) {
    console.error("Connection error:", err.message);
    return null;
  }
}

export function captureReferralFromURL() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ethers.isAddress(ref)) {
    localStorage.setItem("aigods_referrer", ref);
  }
}

async function autoRegisterReferral(user) {
  const referrer = localStorage.getItem("aigods_referrer");
  if (!referrer || !contract) return;
  if (referrer.toLowerCase() === user.toLowerCase()) return;
  try {
    const tx = await contract.registerReferral(referrer, user);
    await tx.wait();
  } catch (e) {
    console.warn("Auto-registration failed or redundant:", e.message);
  }
}

export async function claimAirdrop() {
  if (!contract) {
    const address = await connectWallet();
    if (!address) return;
  }
  try {
    const userAddress = await signer.getAddress();
    const hasClaimed = await contract.hasClaimedAirdrop(userAddress);
    if (hasClaimed) {
      alert("Airdrop already claimed.");
      return;
    }
    const tx = await contract.claimAirdrop();
    alert("Transaction sent... Waiting for confirmation.");
    await tx.wait();
    alert("Airdrop claimed successfully!");
    await loadLeaderboard();
    await updateBalances();
  } catch (err) {
    console.error("Airdrop error:", err.message);
    alert("Airdrop failed: " + (err.reason || err.message));
  }
}

export async function buyPresale(amountMATIC) {
  if (!contract) {
    const address = await connectWallet();
    if (!address) return;
  }
  try {
    const referrer = localStorage.getItem("aigods_referrer") || ethers.ZeroAddress;
    const tx = await contract.buyPreSale(referrer, {
      value: ethers.parseEther(amountMATIC.toString())
    });
    alert("Transaction sent... Waiting for confirmation.");
    await tx.wait();
    alert("Purchase successful.");
    await loadLeaderboard();
    await updateBalances();
  } catch (err) {
    alert("Purchase failed: " + (err.reason || err.message));
  }
}

async function updateBalances() {
  if (!signer || !contract) return;
  try {
    const address = await signer.getAddress();
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    
    // Update UI elements if they exist
    const balanceElement = document.getElementById("userTokenBalance");
    if (balanceElement) {
      balanceElement.innerText = parseFloat(formatted).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    
    // Also update dashboard if available
    const { updateDashboard } = await import("./web3Dashboard.js");
    await updateDashboard();
  } catch (e) {
    console.warn("Balance update failed:", e.message);
  }
}

export async function loadLeaderboard() {
  let fetchContract = contract;
  if (!fetchContract) {
    try {
      const readProvider = new ethers.JsonRpcProvider("https://polygon-rpc.com/");
      fetchContract = new ethers.Contract(PROXY_ADDRESS, ABI, readProvider);
    } catch (e) {
      console.warn("RPC Provider failed, skipping leaderboard fetch.");
      return;
    }
  }
  try {
    const [addresses, counts] = await fetchContract.getTopReferrers();
    const detailedData = addresses.map((addr, index) => ({
      address: addr,
      referrals: Number(counts[index])
    })).filter(item => item.address !== ethers.ZeroAddress);

    if (window.renderLeaderboard) {
      window.renderLeaderboard(detailedData);
    }
  } catch (err) {
    console.error("Leaderboard fetch failed:", err.message);
  }
}

// Periodic refresh every 30 seconds
setInterval(() => {
  loadLeaderboard();
  if (signer && contract) {
    updateBalances();
  }
}, 30000);

captureReferralFromURL();
