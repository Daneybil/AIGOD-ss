import React, { useState, useMemo, useEffect } from 'react';
import { 
  Twitter, 
  Send, 
  MessageSquare, 
  Youtube, 
  ShieldCheck, 
  Copy, 
  ExternalLink,
  Lock,
  Wallet2,
  X,
  Share2,
  Globe,
  FileText,
  Trophy,
  CreditCard as CardIcon,
  Crown,
  Sparkles,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Shield,
  Clock,
  LayoutDashboard,
  Activity,
  Share,
  Rocket,
  Target,
  Megaphone
} from 'lucide-react';
import { ethers } from "https://esm.sh/ethers@6.13.5";
import LogoGrid from './components/LogoGrid.tsx';
import ParticleBackground from './components/ParticleBackground.tsx';
import ChatAssistant from './components/ChatAssistant.tsx';
import { AIGODS_LOGO_URL, PROXY_CONTRACT_ADDRESS, CONTRACT_ABI } from './constants.ts';

// Firebase imports from CDN for the challenge system
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// @ts-ignore
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
// @ts-ignore
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit, enableIndexedDbPersistence, onSnapshot, increment, addDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-TLeC7XjRLQXPRgnkP4Bz7G8LUw3NLJM",
  authDomain: "aigod-s-coin-official.firebaseapp.com",
  projectId: "aigod-s-coin-official",
  storageBucket: "aigod-s-coin-official.firebasestorage.app",
  messagingSenderId: "847357583010",
  appId: "1:847357583010:web:325ee2979d3e8a026dc1fb",
  measurementId: "G-7KF108XF9X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);

// Attempt to enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err: any) => {
    if (err.code === 'failed-precondition') {
      console.warn("Persistence failed: Multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Persistence failed: Browser doesn't support it");
    }
  });
} catch (e) {
  console.warn("Persistence init error:", e);
}

// Badge helper function for the leaderboard
const getBadge = (rank: number) => {
  if (rank === 1) return "CHAMPION";
  if (rank === 2) return "ARCHITECT";
  if (rank === 3) return "VISIONARY";
  return "ELITE";
};

const LOGO_FALLBACK = "https://ui-avatars.com/api/?name=AIGODS&background=0D0D0D&color=00ffff&size=256&bold=true";

const POLYGON_CHAIN_ID = 137; // Polygon Mainnet Decimal

const App: React.FC = () => {
  const [calcAmount, setCalcAmount] = useState<string>('0.0');
  const [calcChain, setCalcChain] = useState<string>('BNB');
  const [calcStage, setCalcStage] = useState<string>('Stage 1 ($0.20)');
  const [buyInput, setBuyInput] = useState<string>('');

  // Web3 Connection States
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [liveFeedData, setLiveFeedData] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [activeReferrer, setActiveReferrer] = useState<string>(localStorage.getItem("aigods_referrer") || ethers.ZeroAddress);
  const [currentUserReferrals, setCurrentUserReferrals] = useState<number>(0);

  // Social Task States
  const [taskTwitter, setTaskTwitter] = useState(false);
  const [taskTelegram, setTaskTelegram] = useState(false);
  const [taskYoutube, setTaskYoutube] = useState(false);

  // Airdrop State
  const [claimedWallets, setClaimedWallets] = useState<Set<string>>(new Set());

  const LAUNCH_PRICE = 3.50;
  const STAGE_1_PRICE = 0.20;
  const STAGE_2_PRICE = 0.80;

  const currentPrice = calcStage.includes('Stage 1') ? STAGE_1_PRICE : STAGE_2_PRICE;
  
  const tokenPrices: Record<string, number> = {
    'BNB': 600,
    'SOL': 150,
    'MATIC': 0.70,
    'USD': 1
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = LOGO_FALLBACK;
  };

  const calculatedTokens = useMemo(() => {
    const amount = parseFloat(calcAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    const usdValue = amount * (tokenPrices[calcChain] || 0);
    return Math.floor(usdValue / currentPrice);
  }, [calcAmount, calcChain, calcStage]);

  const potentialX = useMemo(() => {
    return (LAUNCH_PRICE / currentPrice).toFixed(2);
  }, [currentPrice]);

  const potentialProfit = useMemo(() => {
    const tokens = calculatedTokens;
    if (tokens === 0) return 0;
    return (tokens * LAUNCH_PRICE).toLocaleString();
  }, [calculatedTokens]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const ensureUserRecord = async (address: string) => {
    try {
      const userRef = doc(db, "users", address);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          referrals: 0,
          airdropClaimed: false,
          lastSeen: new Date().toISOString(),
          lastAction: 0
        });
        setCurrentUserReferrals(0);
      } else {
        const data = snap.data();
        setCurrentUserReferrals(data?.referrals || 0);
      }
    } catch (err: any) {
      console.error("Firestore error in ensureUserRecord:", err?.message || err);
    }
  };

  const loadLeaderboard = async () => {
    setFirebaseError(null);
    setIsLeaderboardLoading(true);
    try {
      // Integration Update: Pull data directly from Proxy Contract getLeaderboard()
      const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com/");
      const contract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const addresses: string[] = await contract.getLeaderboard();
      const combinedData = await Promise.all(addresses.map(async (addr) => {
        try {
          const refInfo = await contract.referrals(addr);
          return {
            address: addr,
            referrals: Number(refInfo.referralCount) || 0,
            lastUpdated: Number(refInfo.lastUpdated)
          };
        } catch (e) {
          return { address: addr, referrals: 0, lastUpdated: 0 };
        }
      }));

      // Sort by referrals descending
      const sortedData = combinedData.sort((a, b) => b.referrals - a.referrals);
      setLeaderboardData(sortedData);
    } catch (err: any) {
      console.error("Leaderboard Blockchain Error:", err?.message || err);
      // Fallback only if blockchain fetch fails
      try {
        const q = query(collection(db, "users"), orderBy("referrals", "desc"), limit(10));
        const querySnapshot = await getDocs(q);
        const data: any[] = [];
        querySnapshot.forEach((doc: any) => {
          data.push({ address: doc.id, ...doc.data() });
        });
        setLeaderboardData(data);
      } catch (fbErr) {
        setFirebaseError("Failed to synchronize leaderboard data.");
      }
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  // Auto-refresh leaderboard every 5 seconds
  useEffect(() => {
    loadLeaderboard();
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to ensure user is on Polygon Mainnet
  const ensurePolygonNetwork = async (provider: ethers.BrowserProvider) => {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x89' }], // 137 in hex
        });
        // After switching, refresh provider
        return new ethers.BrowserProvider((window as any).ethereum);
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x89',
                  chainName: 'Polygon Mainnet',
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  rpcUrls: ['https://polygon-rpc.com/'],
                  blockExplorerUrls: ['https://polygonscan.com/'],
                },
              ],
            });
            return new ethers.BrowserProvider((window as any).ethereum);
          } catch (addError) {
            throw new Error("Could not add Polygon network to your wallet.");
          }
        }
        throw new Error("Please switch to Polygon Mainnet to continue.");
      }
    }
    return provider;
  };

  // PERSISTENT REFERRAL DETECTION
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    
    if (refParam && ethers.isAddress(refParam)) {
      console.log("CRITICAL: Referral Detected in URL:", refParam);
      localStorage.setItem("aigods_referrer", refParam);
      setActiveReferrer(refParam);
    } else {
      const stored = localStorage.getItem("aigods_referrer");
      if (stored && ethers.isAddress(stored)) {
        console.log("CRITICAL: Referral Retrieved from Persistent Storage:", stored);
        setActiveReferrer(stored);
      } else {
        console.log("CRITICAL: No active referral detected.");
      }
    }
  }, []);

  // Update logic helper for referral increments
  const recordReferralIncrement = async (buyer: string, referrer: string, amount: string | number) => {
    if (!referrer || referrer === ethers.ZeroAddress || referrer.toLowerCase() === buyer.toLowerCase()) {
      console.log("DEBUG: Skipping referral update - Invalid referrer or self-referral.");
      return;
    }

    try {
      console.log("DEBUG: Initiating Referral Update for referrer:", referrer);
      const referrerRef = doc(db, "users", referrer);
      const buyerRecordRef = doc(db, "referrals", referrer, "buyers", buyer);
      
      const recordSnap = await getDoc(buyerRecordRef);
      if (!recordSnap.exists()) {
        // Record unique referral
        await setDoc(buyerRecordRef, {
          buyer: buyer,
          amount: amount,
          timestamp: new Date().toISOString()
        });
        
        // Atomic increment of leaderboard count in FB (UI Sync)
        await updateDoc(referrerRef, {
          referrals: increment(1)
        });
        console.log("SUCCESS: Leaderboard referral count updated for", referrer);
      }
      // Re-trigger contract fetch to show real-time rankings
      loadLeaderboard();
    } catch (err: any) {
      console.error("ERROR: Referral Persistence Update Failed:", err.message);
    }
  };

  const handleClaimAirdrop = async () => {
    try {
      if (!(window as any).ethereum) {
        alert("Wallet not found");
        return;
      }

      // MANDATORY SOCIAL REDIRECTION LOGIC
      if (!taskTwitter) {
        window.open('https://x.com/AIGODSCOIN', '_blank');
        alert('FOLLOW REQUIRED: Please follow us on Twitter/X to unlock your claim!');
        return;
      }
      if (!taskTelegram) {
        window.open('https://t.me/AIGODSCOINOFFICIAL', '_blank');
        setTimeout(() => { window.open('https://t.me/AIGODSCOIN', '_blank'); }, 1000);
        alert('JOIN REQUIRED: Please join our Telegram Official Channel and Chat Group to unlock your claim!');
        return;
      }
      if (!taskYoutube) {
        window.open('https://www.youtube.com/@AIGODSCOINOFFICIAL', '_blank');
        alert('SUBSCRIBE REQUIRED: Please subscribe to our YouTube channel to unlock your claim!');
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        PROXY_CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      // Send transaction
      alert("Airdrop request sent to wallet. Please confirm...");
      const tx = await contract.claimAirdrop();

      // Pending message
      alert("Transaction broadcasted. Waiting for blockchain confirmation...");

      // Wait for confirmation
      const receipt = await tx.wait();

      // Success check - FIXED LOGIC AS REQUESTED
      if (receipt && receipt.status === 1) {
        alert("✅ Airdrop successfully claimed");
        
        // Database updates
        try {
          if (connectedAddress) {
            const userRef = doc(db, "users", connectedAddress);
            await updateDoc(userRef, { airdropClaimed: true, tokens: increment(100) });
            await addDoc(collection(db, "feed"), {
              wallet: connectedAddress,
              type: 'airdrop',
              amount: 100,
              time: new Date().toISOString()
            });
            await recordReferralIncrement(connectedAddress, activeReferrer, "Airdrop Claim");
            setClaimedWallets(prev => new Set(prev).add(connectedAddress.toLowerCase()));
          }
        } catch (dbErr) {
          console.warn("Local DB sync issue:", dbErr);
        }
      } else {
        alert("❌ Airdrop transaction failed. On-chain execution reverted.");
      }

    } catch (error: any) {
      console.error("Claim error:", error);
      if (error.code === 4001) {
        alert("Claim rejected by user.");
      } else {
        const revertReason = error.reason || error.message || "An unexpected error occurred.";
        alert(`Claim failed: ${revertReason}`);
      }
    }
  };

  const handleBuyPresale = async () => {
    if (!connectedAddress) {
      setIsWalletModalOpen(true);
      return;
    }

    const maticAmount = buyInput || "0.0";
    if (parseFloat(maticAmount) <= 0) {
      alert("Please enter a valid amount to buy.");
      return;
    }

    try {
      let provider = new ethers.BrowserProvider((window as any).ethereum);
      provider = await ensurePolygonNetwork(provider);
      
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PROXY_CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      alert(`Confirming transaction for ${maticAmount} MATIC...`);
      
      // Use activeReferrer from persistent storage
      const tx = await contract.buyPreSale(
        activeReferrer || ethers.ZeroAddress,
        {
          value: ethers.parseUnits(maticAmount.toString(), "ether")
        }
      );

      alert("Transaction sent. Waiting for blockchain confirmation...");
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        alert("✅ Purchase Successful!");
        
        // Trigger registerReferral after successful purchase confirmation
        try {
          console.log("DEBUG: Triggering registerReferral on-chain...");
          const regTx = await contract.registerReferral(activeReferrer || ethers.ZeroAddress, connectedAddress);
          await regTx.wait();
        } catch (regErr: any) {
          console.log("Referral registration on-chain failed or redundant:", regErr.message);
        }

        // RECORD REFERRAL SUCCESS
        await recordReferralIncrement(connectedAddress, activeReferrer, maticAmount);

        // Update Live Feed
        try {
          await addDoc(collection(db, "feed"), {
            wallet: connectedAddress,
            type: 'purchase',
            amount: maticAmount,
            time: new Date().toISOString()
          });
        } catch (feedErr) {
          console.error("Feed error:", feedErr);
        }

        setBuyInput("");
        loadLeaderboard(); // Refresh standings
      } else {
        alert("❌ Transaction failed on-chain.");
      }
    } catch (err: any) {
      console.error("Buy error:", err);
      if (err.code === 4001) {
        alert("Transaction rejected by user.");
      } else {
        const revertReason = err.reason || err.message || "An unexpected error occurred.";
        alert(`Transaction failed: ${revertReason}`);
      }
    }
  };

  useEffect(() => {
    if (isChallengeModalOpen) {
      loadLeaderboard();
      
      const feedQ = query(collection(db, "feed"), orderBy("time", "desc"), limit(15));
      const unsubFeed = onSnapshot(feedQ, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setLiveFeedData(data);
      }, (err) => {
        console.warn("Live Feed Restricted:", err.message);
      });

      return () => {
        unsubFeed();
      };
    }
  }, [isChallengeModalOpen]);

  // Sync personal referral count on connection or modal open
  useEffect(() => {
    if (connectedAddress) {
       const userRef = doc(db, "users", connectedAddress);
       const unsub = onSnapshot(userRef, (snap) => {
         if (snap.exists()) {
           setCurrentUserReferrals(snap.data().referrals || 0);
         }
       });
       return () => unsub();
    }
  }, [connectedAddress]);

  const connectWallet = async (walletName: string) => {
    setIsConnecting(true);
    if ((window as any).ethereum) {
      try {
        let provider = new ethers.BrowserProvider((window as any).ethereum);
        provider = await ensurePolygonNetwork(provider);
        
        const accounts = await provider.send("eth_requestAccounts", []);
        const address = accounts[0];
        setConnectedAddress(address);
        
        const balanceWei = await provider.getBalance(address);
        setWalletBalance(ethers.formatEther(balanceWei).slice(0, 8));
        
        ensureUserRecord(address);
        setIsWalletModalOpen(false);
      } catch (err: any) {
        console.error("Wallet error:", err?.message || err);
        alert(err.message);
      } finally {
        setIsConnecting(false);
      }
    } else {
      alert("Please install MetaMask");
      setIsConnecting(false);
    }
  };

  const handleShareReferral = async () => {
    if (!connectedAddress) {
      setIsWalletModalOpen(true);
      return;
    }
    const referralUrl = `${window.location.origin}?ref=${connectedAddress}`;
    const shareData = {
      title: 'AIGODS Referral Program',
      text: 'Join the AIGODS revolution and earn 20% instant rewards! Use my link to get started:',
      url: referralUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + " " + referralUrl)}`, '_blank');
      }
    } catch (err) {
      console.log('Share failed:', err);
    }
  };

  const userReferrals = useMemo(() => {
    return currentUserReferrals;
  }, [currentUserReferrals]);

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center bg-black overflow-x-hidden pb-10 font-inter text-white">
      <ParticleBackground />

      {/* 1. TOP NAVIGATION HEADER */}
      <div className="top-nav-fixed w-full flex items-center justify-between px-4 md:px-10 py-6 z-[50]">
        <div className="flex items-center gap-2 md:gap-6">
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-8 md:py-4 border-2 border-cyan-500/60 rounded-xl bg-cyan-500/10 text-[9px] md:text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all animate-dim-light-blue shadow-[0_0_20px_rgba(0,255,255,0.15)]"
          >
            <Wallet2 size={14} className="md:w-4 md:h-4" />
            <div className="flex flex-col items-start text-left leading-none">
              <span className="truncate max-w-[80px] md:max-w-none">{connectedAddress ? `${connectedAddress.slice(0,6)}...` : 'Connect'}</span>
              {connectedAddress && <span className="text-[7px] md:text-[8px] text-cyan-500/60 mt-1 uppercase">{walletBalance} {calcChain}</span>}
            </div>
          </button>
          <button 
            onClick={() => setIsWhitepaperOpen(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-8 md:py-4 border-2 border-blue-500/60 rounded-xl bg-blue-500/10 text-[9px] md:text-sm font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all animate-dim-light-blue shadow-[0_0_20px_rgba(255,255,255,0.15)]"
          >
            <FileText size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">White Paper</span>
            <span className="sm:hidden">Paper</span>
          </button>
        </div>

        <div>
          <button 
            onClick={() => setIsChallengeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 md:px-8 md:py-2.5 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full text-[8px] md:text-[11px] font-black uppercase tracking-tight text-white shadow-lg shadow-blue-500/30 hover:scale-105 transition-all animate-dim-light-blue"
          >
            <img 
              src={AIGODS_LOGO_URL} 
              className="w-3 h-3 md:w-4 md:h-4 rounded-full" 
              alt="icon" 
              style={{ display: 'block', visibility: 'visible', opacity: 1 }}
              onError={handleImageError}
            />
            <span className="hidden sm:inline">REFERRAL REWARDS CHALLENGE</span>
            <span className="sm:hidden">REWARDS</span>
          </button>
        </div>

        <div className="block">
           <img 
             src={AIGODS_LOGO_URL} 
             className="w-10 h-10 md:w-16 md:h-16 rounded-full border-2 border-white/20 animate-coin-rotate-y animate-dim-light-blue shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
             alt="logo" 
             style={{ display: 'block', visibility: 'visible', opacity: 1 }}
             onError={handleImageError}
           />
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <div className="w-full max-w-4xl px-4 flex flex-col items-center mt-6">
        <div className="w-full max-w-[95%] md:max-w-4xl py-4 md:py-8 px-4 rounded-full bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#00ffff] flex items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.5)] mb-10 md:mb-14 transition-all text-center">
           <h2 className="text-[3vw] xs:text-sm md:text-5xl font-black italic text-black uppercase tracking-tighter leading-none">
             LAUNCHING SOON — 10$ BILLION+ BACKED
           </h2>
        </div>

        <h1 className="text-[14vw] sm:text-7xl md:text-[10rem] lg:text-[12rem] font-black text-gradient-magenta leading-none uppercase tracking-tighter mb-4 drop-shadow-2xl text-center">
          AIGODS
        </h1>

        <p className="text-cyan-400 font-black tracking-[0.2em] text-[2.5vw] xs:text-[9px] md:text-sm uppercase mb-8 italic text-center">
          THE FUTURE IS NOW – BECOME A GOD <br className="md:hidden" /> IN CRYPTO 👑
        </p>

        <div className="max-w-2xl text-center mb-12">
          <p className="text-white text-base md:text-xl font-bold mb-4 px-2">
            <span className="text-cyan-400">AIGODS</span> is the world's first decentralized superintelligence token, powering AI agents and autonomous economies.
          </p>
          <p className="text-[9px] md:text-[11px] text-gray-500 font-black uppercase tracking-widest leading-relaxed px-4">
            BACKED / PARTNERED BY <span className="text-white">BLACKROCK, TESLA, TWITTER/X, OPENAI, NVIDIA, GOOGLE, APPLE, MICROSOFT</span> AND OTHERS WITH OVER <span className="text-white">$10 BILLION</span> IN COMMITTED CAPITAL.
          </p>
        </div>

        <div className="w-full max-w-3xl aspect-video rounded-3xl md:rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mb-16 md:mb-24 relative bg-gray-900 mx-auto">
           <iframe 
             className="w-full h-full"
             src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1" 
             title="AIGODS Trailer"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowFullScreen
           ></iframe>
        </div>

        <h2 className="text-[10vw] md:text-8xl font-black text-[#00ffff] uppercase tracking-tighter mb-8 md:mb-12 italic text-center">
          PRESALE DETAILS
        </h2>

        {/* PRICING CARDS */}
        <div className="w-full max-w-2xl flex flex-col gap-4 md:gap-6 mb-16">
          <div className="w-full p-6 md:p-12 bg-black/40 border border-gray-800 rounded-3xl md:rounded-[2rem] text-center flex flex-col items-center justify-center transition-all">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">STAGE 1 PRICE</span>
            <span className="text-[15vw] md:text-[6rem] font-black text-white leading-none">$0.20</span>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16da64] animate-pulse"></div>
              <span className="text-[10px] font-black text-[#16da64] uppercase tracking-widest">ACTIVE NOW</span>
            </div>
          </div>

          <div className="w-full p-6 md:p-12 bg-black/40 border border-gray-800 rounded-3xl md:rounded-[2rem] text-center flex flex-col items-center justify-center opacity-40">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">STAGE 2 PRICE</span>
            <span className="text-[15vw] md:text-[6rem] font-black text-gray-400 leading-none">$0.80</span>
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">NEXT PHASE</span>
          </div>

          {/* TARGET LAUNCHING PRICE */}
          <div className="w-full p-6 md:p-12 bg-black/60 border-2 border-cyan-400 rounded-3xl md:rounded-[2.5rem] text-center flex flex-col items-center justify-center shadow-[0_0_80px_rgba(0,255,255,0.4)] relative overflow-hidden animate-dim-light-blue">
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-2 italic">TARGET LAUNCHING PRICE</span>
            <span className="text-[12vw] sm:text-7xl md:text-[8rem] font-black text-white leading-none">$3.50</span>
            <span className="text-[11px] md:text-[14px] font-black text-cyan-400 uppercase tracking-[0.5em] mt-6 italic">2026</span>
          </div>
        </div>

        {/* MULTIPLIER SECTION */}
        <div className="w-full max-w-2xl flex items-center justify-around mb-16 md:mb-20">
          <div className="text-center px-2 md:px-8 border-r border-gray-800 flex-1">
             <div className="text-3xl md:text-8xl font-black text-white">17.5X</div>
             <div className="text-[7px] md:text-[11px] font-black text-green-500 mt-2 uppercase tracking-widest leading-tight">STAGE 1 RETURNS</div>
          </div>
          <div className="text-center px-2 md:px-8 flex-1">
             <div className="text-3xl md:text-8xl font-black text-white">4.375X</div>
             <div className="text-[7px] md:text-[11px] font-black text-green-500 mt-2 uppercase tracking-widest leading-tight">STAGE 2 RETURNS</div>
          </div>
        </div>

        {/* WALLET SYSTEM & 3D COIN */}
        <h2 className="text-lg md:text-4xl font-black text-white uppercase tracking-[0.3em] mb-12 text-center px-4">AIGODS WALLET SYSTEM</h2>
        
        <div className="coin-container mb-12">
          <div className="coin-3d">
            <div className="coin-edge"></div>
            <div className="coin-face coin-face-front">
              <img 
                src={AIGODS_LOGO_URL} 
                alt="AIGODS Front" 
                style={{ display: 'block', visibility: 'visible', opacity: 1, width: '100%', height: '100%' }}
                onError={handleImageError}
              />
            </div>
            <div className="coin-face coin-face-back">
              <img 
                src={AIGODS_LOGO_URL} 
                alt="AIGODS Back" 
                style={{ display: 'block', visibility: 'visible', opacity: 1, width: '100%', height: '100%' }}
                onError={handleImageError}
              />
            </div>
          </div>
        </div>

        {/* CONNECT WALLET BUTTON */}
        <div className="flex flex-col items-center gap-4 mb-20 md:mb-24">
           <button 
             onClick={() => setIsWalletModalOpen(true)}
             className="px-8 md:px-16 py-4 md:py-5 bg-cyan-400 rounded-2xl font-black text-black text-base md:text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105 transition-all"
           >
             CONNECT WALLET
           </button>
           <div className="flex flex-col items-center gap-1">
             <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest break-words-all">
               {connectedAddress ? `CONNECTED: ${connectedAddress.slice(0,10)}...` : 'NOT CONNECTED'}
             </span>
             {connectedAddress && (
               <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                 BALANCE: {walletBalance} {calcChain}
               </span>
             )}
           </div>
        </div>

        {/* TOKEN CALCULATOR CARD */}
        <div className="w-full max-w-2xl bg-[#080812] border border-gray-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-14 shadow-2xl mb-12">
           <h3 className="text-cyan-400 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] text-center mb-8 md:mb-10">TOKEN CALCULATOR</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
              <div className="space-y-3">
                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">INVESTMENT AMOUNT</label>
                 <input 
                   type="text" 
                   value={calcAmount}
                   onChange={(e) => setCalcAmount(e.target.value)}
                   className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white font-bold text-lg focus:border-cyan-500/50 outline-none"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ASSET</label>
                 <select 
                   value={calcChain}
                   onChange={(e) => setCalcChain(e.target.value)}
                   className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white font-bold text-lg outline-none cursor-pointer"
                 >
                   <option>BNB</option>
                   <option>SOL</option>
                   <option>MATIC</option>
                 </select>
              </div>
           </div>
           
           <div className="space-y-3 mb-8 md:mb-10">
              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest">PRESALE PHASE</label>
              <select 
                value={calcStage}
                onChange={(e) => setCalcStage(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white font-bold text-lg outline-none cursor-pointer"
              >
                <option>Stage 1 ($0.20)</option>
                <option>Stage 2 ($0.80)</option>
              </select>
           </div>

           <div className="bg-black/60 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-gray-800 text-center">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-4">EQUIVALENT AIGODS TOKENS</p>
              <p className="text-4xl sm:text-6xl md:text-8xl font-black text-cyan-400 leading-none mb-6 truncate">{calculatedTokens.toLocaleString()}</p>
              <p className="text-[10px] md:text-[11px] font-bold text-[#16da64]">
                 Potential Listing Value: ${potentialProfit} ({potentialX}X)
              </p>
           </div>
        </div>

        {/* NETWORK BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-10 px-2">
           <button onClick={() => setIsWalletModalOpen(true)} className="px-4 py-2 md:px-6 md:py-4 bg-[#f3ba2f] text-black rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest shadow-lg">BNB CHAIN</button>
           <button onClick={() => setIsWalletModalOpen(true)} className="px-4 py-2 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest">POLYGON</button>
           <button onClick={() => setIsWalletModalOpen(true)} className="px-4 py-2 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest">SOLANA</button>
           <button onClick={() => window.open('https://ramp.network/buy/', '_blank')} className="px-4 py-2 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest flex items-center gap-2">
              <CardIcon size={12} className="md:w-[14px]" /> <span className="hidden xs:inline">DEBIT/CREDIT</span>
           </button>
        </div>

        {/* BUY SECTION */}
        <div id="buy-input-section" className="w-full max-w-2xl flex flex-col md:flex-row gap-3 md:gap-4 mb-20 md:mb-24 px-2">
           <input 
             type="text"
             placeholder="Amount (MATIC/USDT)"
             className="flex-1 bg-black/60 border border-gray-800 rounded-2xl md:rounded-[1.5rem] p-5 md:p-6 text-white font-bold outline-none"
             value={buyInput}
             onChange={(e) => setBuyInput(e.target.value)}
           />
           <button 
             onClick={handleBuyPresale}
             className="px-8 md:px-12 py-5 md:py-6 bg-gradient-to-r from-[#ff00ff] via-[#8b5cf6] to-[#00ffff] rounded-2xl md:rounded-[1.5rem] text-black font-black text-lg md:text-xl uppercase tracking-tighter shadow-xl hover:scale-[1.02] transition-all"
           >
             BUY AIGODS NOW
           </button>
        </div>

        {/* SOCIAL TASKS SECTION */}
        <div className="w-full max-w-2xl bg-[#080812]/80 backdrop-blur-md border border-gray-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-center shadow-2xl mb-8 md:mb-10">
           <h3 className="text-white font-black text-base md:text-xl uppercase tracking-widest mb-8 md:mb-10">COMPLETE TASKS BEFORE CLAIMING</h3>
           <div className="flex flex-col gap-5 md:gap-6 max-sm mx-auto text-left">
              {[
                { id: 't1', label: 'FOLLOW TWITTER', state: taskTwitter, set: setTaskTwitter },
                { id: 't2', label: 'JOIN TELEGRAM (CHANNELS & CHAT)', state: taskTelegram, set: setTaskTelegram },
                { id: 't3', label: 'SUBSCRIBE YOUTUBE', state: taskYoutube, set: setTaskYoutube }
              ].map(task => (
                <label key={task.id} className="flex items-center gap-4 md:gap-5 cursor-pointer group">
                  <div className={`w-6 h-6 border-2 border-gray-700 rounded flex items-center justify-center transition-all ${task.state ? 'bg-cyan-500 border-cyan-500' : 'bg-black'}`}>
                    {task.state && <Sparkles size={14} className="text-black" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={task.state} 
                    onChange={(e) => task.set(e.target.checked)} 
                  />
                  <span className="text-[10px] md:text-sm font-black text-gray-500 group-hover:text-white transition-all uppercase tracking-[0.2em]">{task.label}</span>
                </label>
              ))}
           </div>
        </div>

        {/* CLAIM BUTTON */}
        <div className="w-full max-w-2xl mb-16 px-2">
          <button 
            onClick={handleClaimAirdrop}
            className="w-full py-6 md:py-10 rounded-3xl md:rounded-[2rem] bg-[#16da64] text-black font-black text-xl sm:text-3xl md:text-5xl uppercase tracking-tighter hover:scale-[1.02] transition-all shadow-[0_0_50px_rgba(22,218,100,0.6)] leading-none"
          >
            CLAIM 100 AIGODS FREE
          </button>
        </div>

        {/* ARCHITECT REFERRAL SECTION */}
        <div className="w-full max-w-4xl bg-[#080812] border border-gray-800/60 rounded-[3rem] p-6 md:p-16 mb-20 md:mb-24 relative overflow-hidden text-center shadow-[0_0_100px_rgba(0,0,0,0.9)]">
           <h3 className="text-3xl sm:text-5xl md:text-[5.5rem] font-black italic tracking-tighter uppercase leading-none mb-8 md:mb-10">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff00ff]">BECOME AN AIGODS</span> <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff00ff]">ARCHITECT</span>
           </h3>

           <div className="space-y-4 md:space-y-6 mb-10 md:mb-12">
              <h4 className="text-[9px] md:text-sm font-black text-cyan-400 uppercase tracking-[0.5em] mb-4">VIRAL GROWTH IS THE ENGINE OF OUR REVOLUTION.</h4>
              <p className="text-[8px] md:text-[11px] text-gray-400 font-bold leading-relaxed max-w-2xl mx-auto uppercase tracking-widest px-2 md:px-4">
                Referrals are the <span className="text-white font-black italic">fastest way</span> to promote AIGODS. By sharing, you earn <span className="text-[#16da64] font-black italic">20% instant rewards</span> from any investment made through your referral link.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center max-w-3xl mx-auto px-2">
              <div className="md:col-span-8 bg-black border border-gray-800 rounded-xl md:rounded-2xl p-4 flex items-center justify-between text-gray-500 text-[8px] md:text-[10px] font-bold overflow-hidden h-14 md:h-16 shadow-inner">
                 <span className="truncate pr-4 break-words-all">{connectedAddress ? `${window.location.origin}?ref=${connectedAddress}` : "Connect wallet to generate referral link"}</span>
                 {!connectedAddress && <Lock size={14} className="opacity-40 shrink-0" />}
              </div>
              <div className="md:col-span-4">
                <button 
                  onClick={() => !connectedAddress ? setIsWalletModalOpen(true) : copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`)}
                  className="w-full bg-white text-black font-black py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-200 transition-all text-xs md:text-sm uppercase h-14 md:h-16"
                >
                  <Copy size={16} /> COPY LINK
                </button>
              </div>
           </div>

           <div className="mt-8 flex flex-col items-center gap-4">
              <span className="text-[8px] font-black text-[#ff00ff] tracking-[0.2em] uppercase italic">MUST CONNECT WALLET TO UNLOCK REFERRAL REWARDS</span>
              <button 
                onClick={handleShareReferral}
                className="px-8 py-3 bg-[#25D366] text-white rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <MessageSquare size={14} /> SHARE VIA WHATSAPP
              </button>
           </div>
        </div>

        {/* ===== MoonPay Buy MATIC Section ===== */}
        <section id="moonpay-buy-section" className="w-full max-w-4xl mx-auto px-4" style={{
          background: 'linear-gradient(135deg, #0f172a, #020617)',
          padding: '40px 20px',
          textAlign: 'center',
          borderRadius: '24px',
          margin: '40px 0',
          color: 'white',
        }}>

          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter" style={{ marginBottom: '15px' }}>
            Buy MATIC Instantly with MoonPay
          </h2>

          <p style={{ maxWidth: '700px', margin: 'auto', lineHeight: '1.6', opacity: '0.9' }} className="text-xs md:text-base font-medium">
            Don’t have MATIC yet? You can instantly purchase MATIC using your debit or credit card
            through our secure MoonPay gateway. After buying MATIC, participate
            in the AI GODS pre-sale directly on Polygon.
          </p>

          <p style={{ maxWidth: '700px', margin: '15px auto', fontSize: '12px', opacity: '0.8' }} className="font-bold uppercase tracking-widest text-gray-400">
            MoonPay is a trusted global crypto payment provider worldwide.
          </p>

          <a href="https://www.moonpay.com/buy"
             target="_blank"
             style={{
               display: 'inline-block',
               marginTop: '25px',
               padding: '16px 35px',
               background: 'linear-gradient(90deg, #22c55e, #16a34a)',
               color: 'white',
               fontSize: '16px',
               borderRadius: '12px',
               textDecoration: 'none',
               fontWeight: '900',
               textTransform: 'uppercase',
               letterSpacing: '0.1em',
               boxShadow: '0 0 40px rgba(34,197,94,0.4)',
               transition: '0.3s ease',
             }}
             onMouseOver={(e) => { (e.currentTarget as any).style.transform='scale(1.05)'; }}
             onMouseOut={(e) => { (e.currentTarget as any).style.transform='scale(1)'; }}
          >
            Buy MATIC with MoonPay
          </a>

          <div className="mt-8 text-[9px] md:text-[11px] text-gray-500 max-w-lg mx-auto leading-relaxed font-bold uppercase">
            MoonPay allows users to purchase cryptocurrency instantly using debit or credit cards. If you don’t already own MATIC, buy it securely through MoonPay and then use it to participate in the pre-sale on Polygon Mainnet.
          </div>
        </section>

        <LogoGrid />

        {/* AUDITED BY CERTIK SECTION */}
        <div className="w-full max-w-4xl px-4 mt-20 md:mt-24">
          <div className="bg-[#050508] border border-green-500/20 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
             <div className="bg-green-500/10 w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 md:mb-8 border border-green-500/30">
                <ShieldCheck size={32} className="text-green-500 md:w-[40px] md:h-[40px]" />
             </div>
             <h4 className="text-xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 md:mb-6 italic">AUDITED BY CERTIK</h4>
             <p className="text-[9px] md:text-xs text-gray-400 font-medium leading-relaxed max-w-xl mx-auto mb-8 md:mb-10 uppercase tracking-widest">
               The AIGODS smart contract has successfully passed comprehensive security audits by CertiK, ensuring maximum safety for all investors.
             </p>
             <button className="bg-transparent border border-green-500/30 text-green-500 px-8 md:px-14 py-4 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.3em] hover:bg-green-500 hover:text-black transition-all flex items-center gap-2 md:gap-3 mx-auto">
               VIEW AUDIT REPORT <ExternalLink size={14} className="md:w-4 md:h-4" />
             </button>
          </div>
        </div>

        {/* FOOTER SOCIALS */}
        <div className="w-full max-w-5xl px-4 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 mt-20 md:mt-32 text-center md:text-left">
           <div className="space-y-6 md:space-y-8">
              <h5 className="text-cyan-400 text-xl md:text-3xl font-black italic uppercase tracking-tighter">AIGODS OFFICIAL</h5>
              <div className="flex items-center justify-center md:justify-start gap-6 md:gap-12">
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><Twitter size={28} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://t.me/AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer"><Send size={28} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://t.me/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><MessageCircle size={28} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://www.youtube.com/@AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer"><Youtube size={28} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-700 uppercase tracking-widest">JOIN THE FASTEST GROWING DECENTRALIZED AI COMMUNITY.</p>
           </div>
           <div className="space-y-6 md:space-y-8">
              <h5 className="text-[#ff00ff] text-xl md:text-3xl font-black italic uppercase tracking-tighter">INFLUENCER HUB</h5>
              <div className="flex items-center justify-center md:justify-start gap-6 md:gap-12">
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><Twitter size={28} className="text-[#ff00ff] hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><span className="text-white hover:scale-110 transition-all font-black text-2xl md:text-3xl cursor-pointer">X</span></a>
                 <a href="https://aigodscoin.com" target="_blank" rel="noopener noreferrer"><Globe size={28} className="text-white hover:scale-110 transition-all cursor-pointer" /></a>
              </div>
              <p className="text-[8px] md:text-[10px] font-black text-gray-700 uppercase tracking-widest">BRIDGING THE GAP BETWEEN TITANS AND THE FUTURE.</p>
           </div>
        </div>

        {/* FINAL LEGAL FOOTER */}
        <div className="w-full max-w-6xl px-4 text-center space-y-8 md:space-y-10 pb-20 md:pb-24 border-t border-gray-900 pt-16 md:pt-20 mt-20 md:mt-32">
          <h6 className="text-gray-500 font-black text-[9px] md:text-[12px] tracking-[0.4em] md:tracking-[0.6em] uppercase italic">© 2026 AI GODS – THE INTELLIGENCE LAYER OF WEB3</h6>
          <p className="text-[8px] md:text-[10px] text-gray-700 font-bold uppercase leading-relaxed tracking-widest max-w-5xl mx-auto px-2">
            AIGODS STANDS AT THE ABSOLUTE VANGUARD OF THE DECENTRALIZED INTELLIGENCE MOVEMENT, PIONEERING A MULTI-BILLION DOLLAR ECOSYSTEM BACKED BY THE WORLD'S MOST INNOVATIVE GIANTS. JOIN THE ELITE WHO ARE SCALING THE INTELLIGENCE LAYER OF WEB3—THE FUTURE BELONGS TO THE GODS OF AI.
          </p>
        </div>
      </div>

      {/* CHAT ASSISTANT */}
      <ChatAssistant logoUrl={AIGODS_LOGO_URL} />

      {/* CHALLENGE MODAL */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-4 overflow-hidden">
          <div className="absolute inset-0 bg-[#020205]/98" onClick={() => setIsChallengeModalOpen(false)}></div>
          
          <div className="relative w-full max-w-6xl h-full md:h-[95vh] bg-[#05060f] border-x md:border border-gray-800/40 md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,1)]">
              <div className="p-6 md:p-8 border-b border-gray-800/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-yellow-400/40 rounded-xl flex items-center justify-center bg-yellow-400/5">
                    <Trophy className="text-yellow-400" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black text-yellow-400 italic uppercase tracking-tighter leading-none">
                      AIGODS REFERRAL REWARD CHALLENGE
                    </h2>
                    <p className="text-[8px] md:text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1 italic">GLOBAL LEADERS OF THE INTELLIGENCE REVOLUTION</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={loadLeaderboard} className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center hover:bg-blue-600/20 transition-all border border-blue-600/20"><RefreshCw size={20} className={`text-blue-500 ${isLeaderboardLoading ? 'animate-spin' : ''}`} /></button>
                  <button onClick={() => setIsChallengeModalOpen(false)} className="w-12 h-12 bg-red-600/10 rounded-xl flex items-center justify-center hover:bg-red-600/20 transition-all border border-red-600/20"><X size={24} className="text-red-500"/></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                   {[
                     { emoji: "🥇", amount: "20,000 AIGODS", value: "$70,000", label: "COMMITTED CHAMPION REWARD", bg: "bg-blue-600/5", border: "border-blue-500/20" },
                     { emoji: "🥈", amount: "15,000 AIGODS", value: "$52,500", label: "ELITE ARCHITECT REWARD", bg: "bg-blue-600/5", border: "border-blue-500/20" },
                     { emoji: "🥉", amount: "10,000 AIGODS", value: "$35,000", label: "PRO VISIONARY REWARD", bg: "bg-blue-600/5", border: "border-blue-500/20" }
                   ].map((prize, idx) => (
                     <div key={idx} className={`p-8 ${prize.bg} border ${prize.border} rounded-[2rem] flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-300`}>
                        <div className="text-4xl md:text-5xl mb-4 grayscale group-hover:grayscale-0 transition-all">{prize.emoji}</div>
                        <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{prize.amount}</span>
                        <span className="text-3xl md:text-4xl font-black text-yellow-400 italic mb-2 tracking-tighter">{prize.value}</span>
                        <div className="h-[1px] w-12 bg-blue-500/40 my-3"></div>
                        <span className="text-[7px] md:text-[8px] font-black text-blue-500 uppercase tracking-widest">{prize.label}</span>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#0a0c1a] p-6 md:p-8 rounded-[2rem] border border-gray-800/40 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-8">
                       <LayoutDashboard size={14} className="text-yellow-400" />
                       <h4 className="text-yellow-400 font-black uppercase text-[10px] md:text-[11px] tracking-widest italic">YOUR REFERRAL DASHBOARD</h4>
                    </div>
                    <div className="space-y-6 mb-8">
                      <div className="flex justify-between items-center border-b border-gray-800/40 pb-3">
                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">WALLET</span>
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest break-words-all">{connectedAddress ? `${connectedAddress.slice(0,10)}...${connectedAddress.slice(-4)}` : 'NOT CONNECTED'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-gray-800/40 pb-3">
                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">TOTAL REFERRALS</span>
                         <span className="text-2xl font-black text-white italic">{userReferrals}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">COMMISSION (20%)</span>
                         <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] italic animate-pulse">ACTIVE</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => setIsWalletModalOpen(true)} className="py-4 px-4 bg-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                          <Wallet2 size={12} /> CONNECT WALLET
                       </button>
                       <button onClick={handleShareReferral} className="py-4 px-4 bg-yellow-400 text-black rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all">
                          <Share size={12} /> SHARE REFERRAL
                       </button>
                    </div>
                  </div>

                  <div className="bg-[#0a0c1a] p-6 md:p-8 rounded-[2rem] border border-gray-800/40 flex flex-col items-center justify-center relative min-h-[200px]">
                    <div className="absolute top-8 left-8 flex items-center gap-2">
                       <Activity size={14} className="text-yellow-400" />
                       <h4 className="text-yellow-400 font-black uppercase text-[10px] md:text-[11px] tracking-widest italic">LIVE REFERRAL FEED</h4>
                    </div>
                    <div className="flex flex-col items-center opacity-40">
                       <Sparkles size={48} className="text-blue-500 mb-4 animate-pulse" />
                       <p className="text-[9px] font-black text-blue-500 uppercase tracking-[0.4em] text-center italic">MONITORING GLOBAL ACTIVITY...</p>
                    </div>
                    {liveFeedData.length > 0 && (
                      <div className="absolute inset-0 p-8 flex flex-col gap-2 overflow-y-auto mt-16 scrollbar-hide">
                         {liveFeedData.map(feed => (
                           <div key={feed.id} className="bg-black/40 border border-gray-800/40 p-3 rounded-xl flex items-center justify-between animate-fade-in">
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest break-words-all">{feed.wallet.slice(0,6)}...</span>
                             <span className="text-[8px] font-black text-green-500 italic">EARNED COMMISSION</span>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full overflow-hidden rounded-[1.5rem] border border-gray-800/40 shadow-2xl">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-yellow-400">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest">RANK</th>
                        <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest">WALLET</th>
                        <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest">REFERRALS</th>
                        <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest">PROGRESS</th>
                        <th className="px-6 py-4 text-[9px] font-black text-black uppercase tracking-widest text-right">BADGE</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#05060f] divide-y divide-gray-800/40">
                      {leaderboardData.length > 0 ? leaderboardData.map((user, i) => (
                        <tr key={user.address} className="hover:bg-white/[0.02] transition-all group">
                          <td className="px-6 py-5"><span className="text-xl md:text-2xl font-black italic text-yellow-400 tracking-tighter group-hover:scale-110 transition-all inline-block">#{i + 1}</span></td>
                          <td 
                            className="px-6 py-5 font-mono text-blue-500 text-[10px] font-black tracking-widest cursor-pointer hover:text-cyan-400 transition-colors break-words-all"
                            onClick={() => {
                                navigator.clipboard.writeText(user.address);
                                alert(`Copied to clipboard: ${user.address}`);
                            }}
                            title="Click to copy full address"
                          >
                            {user.address.slice(0, 10)}...{user.address.slice(-4)}
                          </td>
                          <td className="px-6 py-5 font-black text-white text-lg italic">{user.referrals || 0}</td>
                          <td className="px-6 py-5">
                             <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500/40 w-[30%]" style={{ width: `${Math.min((user.referrals || 0) * 10, 100)}%` }}></div>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-[10px] font-black text-cyan-400 italic uppercase flex items-center justify-end gap-2">
                               {i === 0 && <Crown size={12} className="text-yellow-400" />}
                               {i === 1 && <Zap size={12} className="text-orange-500" />}
                               {getBadge(i + 1)}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        [1,2].map(i => (
                          <tr key={i} className="opacity-40">
                            <td className="px-6 py-5"><span className="text-xl md:text-2xl font-black italic text-yellow-400 tracking-tighter">#{i}</span></td>
                            <td className="px-6 py-5 font-mono text-blue-500 text-[10px] font-black tracking-widest">...</td>
                            <td className="px-6 py-5 font-black text-white text-lg italic">0</td>
                            <td className="px-6 py-5"><div className="w-24 h-1.5 bg-gray-800 rounded-full"></div></td>
                            <td className="px-6 py-5 text-right"><span className="text-[10px] font-black text-cyan-400 italic uppercase">{i === 1 ? '👑 CHAMPION' : '🔥 ELITE'}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-12 border-t border-gray-800/40 bg-gradient-to-b from-transparent to-blue-900/5 p-8 rounded-[3rem]">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                     <div>
                       <h3 className="text-3xl md:text-4xl font-black text-yellow-400 italic uppercase mb-2 tracking-tighter">STRATEGIC EXPANSION PROTOCOL</h3>
                       <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em]">MAXIMIZING YOUR GLOBAL REACH & REWARDS</p>
                     </div>
                     <div className="flex items-center gap-2 px-6 py-3 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                       <Rocket size={16} className="text-yellow-400 animate-bounce" />
                       <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">20% INSTANT COMMISSION</span>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     <div className="lg:col-span-7 space-y-6">
                        <div className="bg-[#0a0c1a] border border-gray-800/40 p-8 rounded-[2.5rem] relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px]"></div>
                           <h4 className="text-white font-black uppercase text-xs md:text-sm tracking-widest mb-4 flex items-center gap-3 italic">
                             <Target size={18} className="text-blue-500" /> THE MISSION
                           </h4>
                           <div className="space-y-4 text-gray-400 text-[11px] md:text-sm font-medium leading-relaxed">
                              <p>The <span className="text-white font-black italic">AIGODS ecosystem</span> is built to create real global impact in the next generation of decentralized intelligence and digital finance. By referring others, you are helping expand a fast-growing global movement focused on innovation and long-term value creation.</p>
                              <p>This referral challenge is designed to reward early supporters who believe in the future of advanced AI-powered blockchain ecosystems. Every new participant strengthens the network and accelerates adoption worldwide.</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[2rem] hover:bg-blue-600/10 transition-all group">
                              <ul className="space-y-3">
                                 <li className="flex items-start gap-3 text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest leading-tight">
                                    <ChevronRight size={14} className="shrink-0 group-hover:translate-x-1 transition-transform" /> 
                                    <span>Expanding a Global Innovation Community</span>
                                 </li>
                                 <li className="flex items-start gap-3 text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest leading-tight">
                                    <ChevronRight size={14} className="shrink-0 group-hover:translate-x-1 transition-transform" /> 
                                    <span>Helping more people access financial opportunity</span>
                                 </li>
                              </ul>
                           </div>
                           <div className="bg-blue-600/5 border border-blue-500/20 p-6 rounded-[2rem] hover:bg-blue-600/10 transition-all group">
                              <ul className="space-y-3">
                                 <li className="flex items-start gap-3 text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest leading-tight">
                                    <ChevronRight size={14} className="shrink-0 group-hover:translate-x-1 transition-transform" /> 
                                    <span>Positioning yourself as a leader in early adoption</span>
                                 </li>
                                 <li className="flex items-start gap-3 text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-widest leading-tight">
                                    <ChevronRight size={14} className="shrink-0 group-hover:translate-x-1 transition-transform" /> 
                                    <span>Building scalable income through referrals</span>
                                 </li>
                              </ul>
                           </div>
                        </div>
                     </div>

                     <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#0d0f22] border-2 border-blue-500/20 p-8 rounded-[2.5rem]">
                           <h4 className="text-yellow-400 font-black uppercase text-xs md:text-sm tracking-widest mb-6 flex items-center gap-3 italic">
                             <Megaphone size={18} className="text-yellow-400" /> HOW TO SCALE AGGRESSIVELY
                           </h4>
                           <div className="space-y-6">
                              <div className="bg-black/40 p-5 rounded-2xl border border-gray-800/40">
                                 <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2 block">STRATEGY A: SOCIAL DOMINANCE</span>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">Share your unique link on <span className="text-white italic">X, Telegram, TikTok, and Instagram</span>. Create viral content showcasing the 17.5X potential of AIGODS.</p>
                              </div>
                              <div className="bg-black/40 p-5 rounded-2xl border border-gray-800/40">
                                 <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-2 block">STRATEGY B: RUNNING ADS</span>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase leading-relaxed">Leverage <span className="text-white italic">Google Ads or TikTok Creator Ads</span> to drive targeted traffic directly to your link for passive rewards.</p>
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-4">
                           {['GOOGLE ADS', 'TIKTOK VIRAL', 'YOUTUBE MARKETING', 'X COMMUNITIES'].map(tag => (
                             <button 
                               key={tag} 
                               onClick={() => !connectedAddress ? setIsWalletModalOpen(true) : copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`)}
                               className="py-4 bg-black border border-gray-800 hover:border-blue-500 transition-all rounded-xl font-black text-[7px] md:text-[8px] text-blue-500 tracking-[0.2em] uppercase"
                             >
                               {tag}
                             </button>
                           ))}
                        </div>
                     </div>
                   </div>

                   <div className="mt-16 text-center border-t border-gray-800/40 pt-10">
                      <p className="text-yellow-400 font-black italic tracking-[0.5em] uppercase text-xs md:text-base mb-2">STAY FOCUSED • REFER AGGRESSIVELY • WIN BIG</p>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">THE FUTURE BELONGS TO THOSE WHO PARTICIPATE EARLY AND EXECUTE RELENTLESSLY.</p>
                   </div>
                </div>
              </div>
          </div>
        </div>
      )}

      {/* WALLET CONNECTION MODAL */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
            onClick={() => setIsWalletModalOpen(false)}
          ></div>
          
          <div className="relative w-full max-w-[440px] bg-[#0a0a14] border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col items-center animate-fade-in">
             <div className="relative w-20 h-20 md:w-28 md:h-28 mb-8 flex items-center justify-center">
               <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse"></div>
               <img 
                 src={AIGODS_LOGO_URL} 
                 className="relative w-full h-full rounded-full border-2 border-cyan-400/50 shadow-2xl z-10 animate-coin-rotate-y" 
                 alt="logo" 
                 style={{ display: 'block', visibility: 'visible', opacity: 1 }}
                 onError={handleImageError}
               />
             </div>
             
             <div className="w-full flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-cyan-500/10 rounded-xl">
                   <Wallet2 size={24} className="text-cyan-400" />
                 </div>
                 <h3 className="text-xl md:text-2xl font-black uppercase text-white italic tracking-tighter">🔗 CONNECT WALLET</h3>
               </div>
               <button onClick={() => setIsWalletModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                 <X size={28} className="text-gray-400" />
               </button>
             </div>
             
             <div className="grid grid-cols-2 gap-4 w-full">
               {[
                 { name: 'MetaMask', icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg' },
                 { name: 'WalletConnect', icon: 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg' },
                 { name: 'Phantom', icon: 'https://raw.githubusercontent.com/phantom-labs/brand-assets/main/logos/icon/purple.svg' },
                 { name: 'Trust Wallet', icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png' }
               ].map(w => (
                 <button 
                   key={w.name} 
                   onClick={() => connectWallet(w.name)} 
                   className="flex flex-col items-center justify-center gap-5 p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-[#1a1a2e] hover:border-cyan-500/60 transition-all duration-300 group min-h-[160px] shadow-2xl"
                 >
                    <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                      <img src={w.icon} className="max-w-full max-h-full group-hover:scale-110 transition-transform duration-300 brightness-125 contrast-125 object-contain" alt={w.name} />
                    </div>
                    <span className="font-black text-gray-300 group-hover:text-white uppercase text-[10px] md:text-[12px] tracking-widest text-center">{w.name}</span>
                 </button>
               ))}
             </div>
             
             <div className="mt-10 text-center border-t border-white/5 pt-6 w-full">
               <div className="flex items-center justify-center gap-2 text-[9px] text-cyan-400/60 uppercase font-black tracking-[0.3em] italic">
                 <Shield size={14} /> SECURE CRYPTOGRAPHIC PROTOCOL v2.5
               </div>
             </div>
          </div>
        </div>
      )}

      {/* WHITEPAPER MODAL */}
      {isWhitepaperOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 overflow-hidden">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setIsWhitepaperOpen(false)}></div>
          <div className="relative w-full max-w-[1200px] h-full md:h-[98vh] bg-[#050508] border-x md:border border-white/10 md:rounded-[2.5rem] overflow-hidden flex flex-col font-inter text-[#eaf2ff]">
             <div className="w-full bg-[#3d2e05]/60 py-3 px-4 border-b border-yellow-500/20 text-center">
               <span className="text-[7px] md:text-[10px] font-black text-yellow-500 uppercase tracking-widest leading-none">
                 NOTE: THIS IS THE PRE-SALE WHITE PAPER. THE MAIN WHITE PAPER WILL BE ARRIVING SOON AFTER LAUNCHING.
               </span>
             </div>

             <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-12 py-6 md:py-10">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <img 
                        src={AIGODS_LOGO_URL} 
                        className="w-12 h-12 md:w-20 md:h-20 rounded-full border border-white/10 shadow-2xl" 
                        style={{ display: 'block', visibility: 'visible', opacity: 1 }}
                        onError={handleImageError}
                      />
                      <div>
                        <h2 className="text-lg md:text-3xl font-black italic text-white uppercase leading-none">AI GODS (AIGODS)</h2>
                        <span className="text-[7px] md:text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] mt-1 block">PRE-SALE & AIRDROP WHITEPAPER</span>
                      </div>
                    </div>
                    <button onClick={() => setIsWhitepaperOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 border border-white/10"><X size={18} className="text-gray-400" /></button>
                 </div>

                 <div className="text-center mb-10">
                    <h1 className="text-3xl md:text-6xl font-black italic uppercase text-white leading-tight drop-shadow-2xl">
                      THE FUTURE IS NOW — BECOME A<br/>GOD IN CRYPTO 👑
                    </h1>
                 </div>

                 <div className="w-full rounded-[2.5rem] overflow-hidden border border-white/10 mb-2 shadow-[0_0_60px_rgba(255,255,255,0.05)]">
                    <img 
                      src={AIGODS_LOGO_URL} 
                      alt="The Titan" 
                      className="w-full aspect-[16/9] object-cover"
                      style={{ display: 'block', visibility: 'visible', opacity: 1 }}
                      onError={handleImageError}
                    />
                 </div>
                 <p className="text-center text-[7px] md:text-[8px] font-black text-gray-600 uppercase tracking-[0.4em] mb-12">
                   A MAJESTIC BEARDED TITAN, HALF CYBERNETIC HUMAN, HALF BLAZING AIGODS SYMBOL
                 </p>

                 <div className="bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] p-6 md:p-12 mb-10 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                       <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-black font-black text-xs">1</div>
                       <h3 className="text-base md:text-2xl font-black italic text-cyan-400 uppercase">INTRODUCTION — WELCOME TO AI GODS</h3>
                    </div>
                    <p className="text-sm md:text-lg text-gray-300 font-bold leading-relaxed mb-8">
                      AI GODS is not just another token. It is a revolutionary decentralized voice intelligence reward system—empowering real-world AI applications with voice-powered intelligence, smart automation, and community-driven innovation.
                    </p>
                    
                    <div className="mb-8">
                       <span className="text-[7px] md:text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-3">BUILT FOR THE AI ERA THROUGH ALIGNMENT WITH INDUSTRY TITANS & INNOVATORS:</span>
                       <p className="text-[9px] md:text-[11px] font-black text-white/80 tracking-wide leading-relaxed">
                         BlackRock • Tesla • OpenAI • Microsoft • Nvidia • Google • Apple • X (Twitter) • and more.
                       </p>
                    </div>

                    <div className="p-6 md:p-10 bg-blue-600/5 rounded-[2rem] border-l-4 border-cyan-400 relative overflow-hidden">
                       <Globe size={40} className="absolute -bottom-2 -right-2 text-cyan-400/5 rotate-12" />
                       <p className="text-lg md:text-3xl italic font-black text-white leading-tight">
                         "With over $10 billion in committed ecosystem capital, AI GODS is positioned to dominate the intersection of artificial intelligence and cryptocurrency."
                       </p>
                    </div>

                    <div className="mt-8">
                       <p className="text-[9px] md:text-[11px] font-black text-yellow-500 italic uppercase tracking-widest mb-1">AI GODS IS HERE TO CREATE MASSIVE AWARENESS IN THE WORLD OF CRYPTO. STAY UP, GET READY TO BE RICH, AND RETIRE EARLY.</p>
                       <p className="text-[9px] md:text-[11px] font-black text-white uppercase italic">THE FUTURE IS NOW — AIGODS COIN OFFICIAL IS THE KING! 👑</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                   <div className="p-8 md:p-10 bg-[#0a0a0f] rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-6 h-6 rounded bg-pink-500 flex items-center justify-center text-black font-black text-xs">2</div>
                         <h4 className="text-base md:text-xl font-black italic text-white uppercase">TOKEN DETAILS</h4>
                      </div>
                      <div className="space-y-4">
                        {[
                          { l: 'TOKEN NAME', v: 'AI GODS COIN' },
                          { l: 'SYMBOL', v: 'AIGODS' },
                          { l: 'TOTAL SUPPLY', v: '700,000,000' },
                          { l: 'DECIMALS', v: '18' },
                          { l: 'BLOCKCHAIN', v: 'Polygon' }
                        ].map(item => (
                          <div key={item.l} className="flex justify-between items-center border-b border-white/5 pb-2">
                             <span className="text-[8px] font-black text-gray-500 uppercase">{item.l}</span>
                             <span className="text-[10px] md:text-[12px] font-black text-white">{item.v}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[7px] md:text-[9px] font-black text-blue-400 mt-2 italic">Other blockchains coming soon after launch.</p>
                      <div className="mt-8 pt-6 border-t border-white/5">
                         <span className="text-[8px] font-black text-pink-500 uppercase mb-4 block italic">ALLOCATION</span>
                         <div className="space-y-3">
                            <div className="p-3 bg-pink-500/10 rounded-xl border border-pink-500/20 flex justify-between items-center">
                               <span className="text-[10px] font-black text-pink-500">80% — Pre-Sale (Community)</span>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                               <span className="text-[10px] font-black text-gray-400">20% — Team & Ecosystem</span>
                            </div>
                         </div>
                         <p className="text-center text-[7px] font-black text-gray-700 uppercase mt-4">PURE COMMUNITY-FIRST DESIGN.</p>
                      </div>
                   </div>

                   <div className="p-8 md:p-10 bg-[#0a0a0f] rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-black font-black text-xs">3</div>
                         <h4 className="text-base md:text-xl font-black italic text-white uppercase">PRE-SALE STAGES</h4>
                      </div>
                      <div className="space-y-4">
                        <div className="p-5 bg-cyan-400/5 border border-cyan-400/20 rounded-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-cyan-400 px-3 py-1 text-[7px] font-black text-black uppercase">STAGE 1 — EARLY BIRD</div>
                           <p className="text-xl md:text-2xl font-black text-white">$0.20 per AIGODS</p>
                           <p className="text-[9px] font-black text-cyan-400 mt-1 uppercase">17.5X POTENTIAL UPSIDE</p>
                        </div>
                        <div className="p-5 bg-pink-500/5 border border-pink-500/20 rounded-2xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 bg-pink-500 px-3 py-1 text-[7px] font-black text-black uppercase">STAGE 2 — ACCUMULATION</div>
                           <p className="text-xl md:text-2xl font-black text-white">$0.80 per AIGODS</p>
                           <p className="text-[9px] font-black text-pink-500 mt-1 uppercase">4.375X POTENTIAL UPSIDE</p>
                        </div>
                        <div className="p-8 text-center border-t border-white/10 pt-8 mt-4 animate-dim-light-blue">
                           <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block mb-2">TARGET LISTING PRICE</span>
                           <span className="text-5xl md:text-7xl font-black text-white leading-none">$3.50</span>
                        </div>
                      </div>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    <div className="p-8 md:p-12 bg-[#0a0a0f] rounded-[2.5rem] border border-white/5 group hover:border-cyan-400/20 transition-all">
                       <h4 className="text-lg md:text-2xl font-black italic text-cyan-400 uppercase mb-4 leading-tight">4. EASY PURCHASE OPTIONS</h4>
                       <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed">
                         Buy with <span className="text-white italic">MATIC on Polygon Mainnet</span>. No crypto? No problem. Purchase instantly using <span className="text-white">Debit or Credit Card</span>. Tokens reflect automatically.
                       </p>
                       <button onClick={() => { setIsWhitepaperOpen(false); setTimeout(() => document.getElementById('moonpay-buy-section')?.scrollIntoView({behavior:'smooth'}), 300); }} className="w-full py-5 bg-cyan-400 text-black font-black uppercase text-[10px] md:text-xs rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] group-hover:scale-105 transition-all">BUY AIGODS NOW</button>
                    </div>
                    <div className="p-8 md:p-12 bg-[#0a0a0f] rounded-[2.5rem] border border-white/5 group hover:border-green-500/20 transition-all">
                       <h4 className="text-lg md:text-2xl font-black italic text-cyan-400 uppercase mb-4 leading-tight">5. FREE AIRDROP</h4>
                       <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed">
                         100 AIGODS FREE per eligible wallet. One claim per wallet. At listing price, this is <span className="text-white">$350 potential value</span>.
                       </p>
                       <button onClick={() => { setIsWhitepaperOpen(false); setTimeout(() => document.getElementById('buy-input-section')?.scrollIntoView({behavior:'smooth'}), 300); }} className="w-full py-5 bg-green-500 text-black font-black uppercase text-[10px] md:text-xs rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)] group-hover:scale-105 transition-all">CLAIM FREE 100 AIGODS</button>
                    </div>
                 </div>

                 <div className="bg-gradient-to-br from-[#1c021c] to-[#050508] border border-[#ff00ff]/20 rounded-[3rem] p-10 md:p-20 text-center mb-16 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-40"></div>
                    <h4 className="text-3xl md:text-6xl font-black italic text-[#ff00ff] uppercase mb-6 leading-tight tracking-tighter">6. POWERFUL REFERRAL SYSTEM</h4>
                    <p className="text-[11px] md:text-sm font-bold text-gray-300 uppercase tracking-widest mb-10 max-w-2xl mx-auto leading-relaxed">
                      Promote AI GODS and earn <span className="text-green-500 font-black italic">20% INSTANT REWARDS</span> of every purchase made through your unique link.
                    </p>
                    <button onClick={() => { setIsWhitepaperOpen(false); setIsChallengeModalOpen(true); }} className="px-12 py-5 bg-white text-black font-black uppercase text-xs md:text-sm rounded-2xl shadow-xl hover:scale-105 transition-all">GET REFERRAL LINK</button>
                 </div>

                 <div className="text-center mb-20">
                    <h4 className="text-3xl md:text-5xl font-black italic text-white uppercase mb-4">7. WHY AI GODS?</h4>
                    <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-12 max-w-xl mx-auto">
                      AI GODS combines decentralized voice AI, powerful incentives, and massive global momentum. This isn't just hype—it's a movement.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {[
                         { t: 'MAXIMUM UPSIDE', d: 'EARLY ACCESS TO LOW PRE-SALE PRICING' },
                         { t: 'COMMUNITY DOMINANCE', d: 'POWERED BY THE ARCHITECTURE OF WEB3' },
                         { t: 'FINANCIAL FREEDOM', d: 'BUILT FOR THE TITANS & VISIONARIES' }
                       ].map((card, i) => (
                         <div key={i} className="p-8 bg-[#0a0a0f] rounded-[2rem] border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
                            <span className="text-[10px] md:text-xs font-black text-cyan-400 italic mb-4 uppercase tracking-widest">{card.t}</span>
                            <p className="text-[8px] md:text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">{card.d}</p>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="text-center py-20 border-t border-white/5">
                   <h2 className="text-5xl md:text-[8rem] font-black italic uppercase text-white leading-[0.8] mb-6 tracking-tighter">AI GODS — THE FUTURE<br/>IS HERE.</h2>
                   <p className="text-2xl md:text-[4rem] font-black italic uppercase text-yellow-400 leading-none mb-10 tracking-tighter">
                     BE RICH. RETIRE EARLY. RULE THE CRYPTO WORLD. 👑
                   </p>
                   <button onClick={() => setIsWhitepaperOpen(false)} className="mt-12 bg-white/5 border border-white/10 text-gray-400 px-12 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.4em] hover:bg-white/10 transition-all">CLOSE WHITE PAPER</button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;