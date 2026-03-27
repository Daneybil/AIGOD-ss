import { ethers } from "ethers";
import { BSC_RPC_URLS } from "./constants.ts";

//////////////////////////////////////////////////
// NETWORK CONFIG
//////////////////////////////////////////////////

const BSC_CHAIN = {
  chainId: "0x38",
  chainName: "Binance Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18
  },
  rpcUrls: BSC_RPC_URLS,
  blockExplorerUrls: ["https://bscscan.com"]
};

//////////////////////////////////////////////////
// FORCE NETWORK SWITCH
//////////////////////////////////////////////////

export async function forceBSC() {
  if (!window.ethereum) throw new Error("No wallet");

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === BSC_CHAIN.chainId) return;

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN.chainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BSC_CHAIN]
        });
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
}

//////////////////////////////////////////////////
// SAFE CONTRACT CALL WRAPPER
//////////////////////////////////////////////////

export async function safeContractCall(contract, fnName, args = [], value = null) {
  try {
    const overrides = value
      ? { value: ethers.parseEther(value.toString()) }
      : {};

    const tx = await contract[fnName](...args, overrides);

    console.log("TX SENT:", tx.hash);

    const receipt = await tx.wait();

    console.log("TX SUCCESS:", receipt);

    alert("Transaction successful!");

    return receipt;

  } catch (err) {

    console.error("FULL ERROR:", err);

    if (err.data) {
      console.error("REVERT DATA:", err.data);
    }

    alert("Transaction failed. Check console.");

    throw err;
  }
}
