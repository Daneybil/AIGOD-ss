import { ethers } from "ethers";
import { 
  getWeb3State, 
  updateBalances, 
  loadLeaderboard as serviceLoadLeaderboard, 
  buyPresale as serviceBuyPresale, 
  claimAirdrop as serviceClaimAirdrop 
} from "./web3Service.js";

export async function connectWallet() {
  try {
    const { signer } = await getWeb3State();
    const address = await signer.getAddress();
    await updateBalances();
    await serviceLoadLeaderboard();
    return address;
  } catch (err) {
    console.error("Connection error:", err.message);
    if (err.code !== 4001) {
      const msg = err.reason || err.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("getCode")) {
        alert("Connection Error: Unable to reach the blockchain network. Please check your internet connection and ensure your wallet is set to Binance Smart Chain.");
      } else {
        alert("Connection error: " + msg);
      }
    }
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

export async function claimAirdrop() {
  try {
    const tx = await serviceClaimAirdrop();
    alert("Airdrop claimed successfully!");
    return tx;
  } catch (error) {
    console.error("Airdrop error:", error);
    alert(error.reason || error.message || "Transaction failed");
  }
}

export async function buyPresale(amountBNB) {
  try {
    const tx = await serviceBuyPresale(amountBNB);
    alert("Purchase successful!");
    return tx;
  } catch (error) {
    console.error("Purchase error:", error);
    alert(error.reason || error.message || "Transaction failed");
  }
}

export async function loadLeaderboard() {
  return serviceLoadLeaderboard();
}

// Periodic refresh every 30 seconds
setInterval(() => {
  serviceLoadLeaderboard();
  updateBalances();
}, 30000);

captureReferralFromURL();
