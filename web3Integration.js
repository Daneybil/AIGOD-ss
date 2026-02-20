import { ethers } from "https://esm.sh/ethers@6.13.5";
import { forcePolygon, safeContractCall } from "./polygonFix.js";

//////////////////////////////////////////////////
// CONFIG — AIGODS PROXY
//////////////////////////////////////////////////

const PROXY_ADDRESS = "0x90bA2e2E23155DB5c00aD99Dc30503fb760b7157";

const ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldAdmin",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "AdminChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "impl",
				"type": "address"
			}
		],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "rank",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalReferrals",
				"type": "uint256"
			}
		],
		"name": "LeaderboardUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "referee",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalReferrals",
				"type": "uint256"
			}
		],
		"name": "ReferralRegistered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "oldImpl",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newImpl",
				"type": "address"
			}
		],
		"name": "Upgraded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "WithdrawBNB",
		"type": "event"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [],
		"name": "admin",
		"outputs": [
			{
				"internalType": "address",
				"name": "adm",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			}
		],
		"name": "buyPreSale",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "claimAirdrop",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "confirmLiquidityAdded",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "target",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "executeDelegateCall",
		"outputs": [
			{
				"internalType": "bytes",
				"name": "",
				"type": "bytes"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "forceSwapBack",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getLeaderboard",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "implementation",
		"outputs": [
			{
				"internalType": "address",
				"name": "impl",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "devWallet",
				"type": "address"
			}
		],
		"name": "initializeProxy",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "leaderboard",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "leaderboardSize",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "manualBurn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "referrals",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "referralCount",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastUpdated",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "referrer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "referee",
				"type": "address"
			}
		],
		"name": "registerReferral",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newImpl",
				"type": "address"
			}
		],
		"name": "setImplementation",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newAdmin",
				"type": "address"
			}
		],
		"name": "transferAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newImpl",
				"type": "address"
			},
			{
				"internalType": "bytes",
				"name": "data",
				"type": "bytes"
			}
		],
		"name": "upgradeToAndCall",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdrawBNB",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "withdrawToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
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
    await safeContractCall(contract, "claimAirdrop");
    await loadLeaderboard();
  } catch (err) {
    console.error("Airdrop call error handled by wrapper.");
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
    const user = await signer.getAddress();
    await autoRegisterReferral(user);
    alert("Purchase successful.");
    await loadLeaderboard();
  } catch (err) {
    alert("Purchase failed: " + (err.reason || err.message));
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
    const sizeBig = await fetchContract.leaderboardSize();
    const count = Number(sizeBig);
    const limit = Math.min(count, 10);
    const addresses = [];
    for (let i = 0; i < limit; i++) {
      try {
        const addr = await fetchContract.leaderboard(i);
        if (addr && addr !== ethers.ZeroAddress) {
          addresses.push(addr);
        }
      } catch (e) {}
    }
    const detailedData = await Promise.all(addresses.map(async (addr) => {
      try {
        const info = await fetchContract.referrals(addr);
        return { 
          address: addr, 
          referrals: Number(info.referralCount) || 0 
        };
      } catch (e) {
        return { address: addr, referrals: 0 };
      }
    }));
    const sortedData = detailedData.sort((a, b) => b.referrals - a.referrals);
    if (window.renderLeaderboard) {
      window.renderLeaderboard(sortedData);
    }
  } catch (err) {
    console.error("Leaderboard fetch failed:", err.message);
  }
}

captureReferralFromURL();
