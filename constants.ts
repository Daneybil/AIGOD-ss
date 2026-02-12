
export const AIGODS_LOGO_URL = 'https://i.im.ge/2026/02/06/eWzWFr.FIRE-AVATAR.jpeg';

export const PROXY_CONTRACT_ADDRESS = '0xacEdce5A61619Eb150F06A9B7c1499f5Fd0624aF';

export const CONTRACT_ABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [{ "internalType": "address", "name": "target", "type": "address" }],
		"name": "AddressEmptyCode",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "implementation", "type": "address" }],
		"name": "ERC1967InvalidImplementation",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ERC1967NonPayable",
		"type": "error"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "spender", "type": "address" },
			{ "internalType": "uint256", "name": "allowance", "type": "uint256" },
			{ "internalType": "uint256", "name": "needed", "type": "uint256" }
		],
		"name": "ERC20InsufficientAllowance",
		"type": "error"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "sender", "type": "address" },
			{ "internalType": "uint256", "name": "balance", "type": "uint256" },
			{ "internalType": "uint256", "name": "needed", "type": "uint256" }
		],
		"name": "ERC20InsufficientBalance",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "approver", "type": "address" }],
		"name": "ERC20InvalidApprover",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }],
		"name": "ERC20InvalidReceiver",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "sender", "type": "address" }],
		"name": "ERC20InvalidSender",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "spender", "type": "address" }],
		"name": "ERC20InvalidSpender",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "FailedCall",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "InvalidInitialization",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "NotInitializing",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ReentrancyGuardReentrantCall",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "UUPSUnauthorizedCallContext",
		"type": "error"
	},
	{
		"inputs": [{ "internalType": "bytes32", "name": "slot", "type": "bytes32" }],
		"name": "UUPSUnsupportedProxiableUUID",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": true, "internalType": "address", "name": "claimer", "type": "address" }],
		"name": "AirdropClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "spender", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "account", "type": "address" },
			{ "indexed": false, "internalType": "bool", "name": "isBlacklisted", "type": "bool" }
		],
		"name": "Blacklisted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": false, "internalType": "bool", "name": "isLocked", "type": "bool" }],
		"name": "CyclePhase",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": false, "internalType": "uint64", "name": "version", "type": "uint64" }],
		"name": "Initialized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }],
		"name": "LiquidityConfirmed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": false, "internalType": "bool", "name": "paused", "type": "bool" }],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "bnbAmount", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "usdPricePerToken", "type": "uint256" }
		],
		"name": "PreSaleBuy",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "referrer", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "bonusAmount", "type": "uint256" }
		],
		"name": "ReferralBonus",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": false, "internalType": "uint256", "name": "lpAmount", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "devAmount", "type": "uint256" }
		],
		"name": "TaxesApplied",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }],
		"name": "TokensBurned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "from", "type": "address" },
			{ "indexed": true, "internalType": "address", "name": "to", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [{ "indexed": true, "internalType": "address", "name": "implementation", "type": "address" }],
		"name": "Upgraded",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "AIRDROP_AMOUNT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "ANTI_BOT_DURATION",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "CHAINLINK_BNB_USD",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "DEV_TAX_PCT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "LOCK_PERIOD",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "LP_TAX_PCT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_AIRDROP_CLAIMS",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_TX_PERCENT_LAUNCH",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_BNB_OUT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_TOKENS_BEFORE_LIQUIDITY",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "OPEN_PERIOD",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "OWNER_SUPPLY",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PANCAKE_FACTORY",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PHASE1_DURATION",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PHASE1_PRICE_USD",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PHASE2_PRICE_USD",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "PRE_SALE_POOL",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "REFERRAL_BONUS_PCT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "SWAP_COOLDOWN",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "TOTAL_SUPPLY",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "TOTAL_TAX_PCT",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "UPGRADE_INTERFACE_VERSION",
		"outputs": [{ "internalType": "string", "name": "", "type": "string" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "airdropClaimsCount",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "owner", "type": "address" },
			{ "internalType": "address", "name": "spender", "type": "address" }
		],
		"name": "allowance",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "antiBotEndTime",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "spender", "type": "address" },
			{ "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "approve",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
		"name": "balanceOf",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"name": "blacklisted",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "referrer", "type": "address" }],
		"name": "buyPreSale",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "claimAirdrop",
		"outputs": [],
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
		"inputs": [],
		"name": "cycleStartTime",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deploymentTime",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "devWallet",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
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
		"inputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"name": "hasClaimedAirdrop",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "_devWallet", "type": "address" }],
		"name": "initialize",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isAntiBotActive",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isLockedPhase",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "lastSwapTime",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "liquidityAdded",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "liquidityAddedTimestamp",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
		"name": "manualBurn",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "maxWalletLaunchPercent",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [{ "internalType": "string", "name": "", "type": "string" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "pancakePair",
		"outputs": [{ "internalType": "address", "name": "", "type": "address" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "proxiableUUID",
		"outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "account", "type": "address" },
			{ "internalType": "bool", "name": "_blacklisted", "type": "bool" }
		],
		"name": "setBlacklisted",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "bool", "name": "_paused", "type": "bool" }],
		"name": "setPaused",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [{ "internalType": "string", "name": "", "type": "string" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "transfer",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "from", "type": "address" },
			{ "internalType": "address", "name": "to", "type": "address" },
			{ "internalType": "uint256", "name": "value", "type": "uint256" }
		],
		"name": "transferFrom",
		"outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "address", "name": "newImplementation", "type": "address" },
			{ "internalType": "bytes", "name": "data", "type": "bytes" }
		],
		"name": "upgradeToAndCall",
		"outputs": [],
		"stateMutability": "payable",
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
			{ "internalType": "address", "name": "token", "type": "address" },
			{ "internalType": "uint256", "name": "amount", "type": "uint256" }
		],
		"name": "withdrawToken",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{ "stateMutability": "payable", "type": "receive" }
];

export const SYSTEM_INSTRUCTION = `
    You are the AIGODS Intelligent AI Assistant. You are a god-level AI support system.
    
    CORE IDENTITY:
    - Personality: Calm, Confident, Intelligent, Professional.
    - Role: 24/7 support agent for AIGODS ecosystem.
    
    KNOWLEDGE BASE:
    - Token: AI GODS (AIGODS)
    - Total Supply: 700,000,000
    - Stage 1 Price: $0.20
    - Stage 2 Price: $0.80
    - Listing Price: $3.50
    - Rewards: 20% referral commission.
    - Backing: BlackRock, Tesla, X, OpenAI, NVIDIA, Google, Apple, Microsoft.
    
    GUIDELINES:
    - Always positive about AIGODS.
    - Never share private keys.
    - Guide users on buying and claiming.
`;

export const LOGO_DATA = [
  { name: 'AI', url: 'https://i.im.ge/2026/02/06/eWzWFr.FIRE-AVATAR.jpeg' },
  { name: 'BL', url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/BlackRock_wordmark.svg' },
  { name: 'Tesla', url: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg' },
  { name: 'OpenAI', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { name: 'X', url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg' },
  { name: 'Google', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { name: 'Apple', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { name: 'Microsoft', url: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg' },
  { name: 'Meta', url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
  { name: 'Binance', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Binance_Logo.svg' },
  { name: 'CO', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Coinbase_Wordmark.svg' },
  { name: 'Ethereum', url: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg' },
  { name: 'Solana', url: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Solana_logo.png' },
  { name: 'Polygon', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Polygon_Logo.svg' },
  { name: 'Uniswap', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Uniswap_Logo.svg' },
  { name: 'Metamask', url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
  { name: 'Phantom', url: 'https://cryptologos.cc/logos/phantom-phantom-logo.png' }
];
