import { ethers } from "ethers";

//////////////////////////////////////////////////
// NETWORK CONFIG
//////////////////////////////////////////////////

const POLYGON_CHAIN = {
  chainId: "0x89",
  chainName: "Polygon Mainnet",
  nativeCurrency: {
    name: "MATIC",
    symbol: "MATIC",
    decimals: 18
  },
  rpcUrls: ["https://polygon-rpc.com"],
  blockExplorerUrls: ["https://polygonscan.com"]
};

//////////////////////////////////////////////////
// FORCE NETWORK SWITCH
//////////////////////////////////////////////////

export async function forcePolygon() {
  if (!window.ethereum) throw new Error("No wallet");

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId === POLYGON_CHAIN.chainId) return;

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_CHAIN.chainId }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [POLYGON_CHAIN]
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
