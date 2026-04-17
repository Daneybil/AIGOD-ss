import { ethers } from "ethers";
import { PROXY_CONTRACT_ADDRESS, BSC_RPC_URLS, AIGODS_LOGO_URL } from "./constants.ts";
import { 
  getWeb3State, 
  updateBalances, 
  buyPresale as serviceBuyPresale, 
  claimAirdrop as serviceClaimAirdrop,
  sellTokens as serviceSellTokens,
  forceBSC
} from "./web3Service.js";

export async function connectWallet() {
  return getWeb3State();
}

export async function buyWithReferral(referrer, ethAmount) {
  try {
    const tx = await serviceBuyPresale(ethAmount);
    alert("Purchase successful!");
    return tx;
  } catch (error) {
    console.error("Purchase error:", error);
    alert(error.reason || error.message || "Transaction failed");
  }
}

export async function sellTokens(tokenAmount) {
  try {
    const tx = await serviceSellTokens(tokenAmount);
    alert("Sale successful!");
    return tx;
  } catch (error) {
    console.error("Sale error:", error);
    alert(error.reason || error.message || "Transaction failed");
  }
}

export async function getUserReferrals(address) {
  try {
    const { contract } = await getWeb3State();
    const count = await contract.getReferralCount(address);
    return Number(count);
  } catch (err) {
    console.error("Error fetching referrals:", err);
    return 0;
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

export async function updateDashboard() {
  return updateBalances();
}

export async function addTokenToWallet() {
  if (!window.ethereum) {
    alert("Please install MetaMask or use a Web3 browser");
    return;
  }

  const tokenAddress = PROXY_CONTRACT_ADDRESS;
  const tokenSymbol = "AIGODS";
  const tokenDecimals = 18;
  const tokenImage = AIGODS_LOGO_URL;

  try {
    // 1. Ensure user is on BSC first
    await forceBSC();

    // 2. Request account access if not already connected
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    // 3. Trigger the add token popup
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
      alert("AIGODS token was successfully added to your wallet!");
    }
  } catch (err) {
    console.error("Add token error:", err);
    if (err.code === 4001) {
      alert("Token addition cancelled by user.");
    } else {
      alert("Error adding token: " + (err.message || "Unknown error"));
    }
  }
}
