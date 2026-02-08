
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
  Clock
} from 'lucide-react';
import LogoGrid from './components/LogoGrid';
import ParticleBackground from './components/ParticleBackground';
import ChatAssistant from './components/ChatAssistant';
import { AIGODS_LOGO_URL } from './constants';

// Firebase imports from CDN for the challenge system
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// @ts-ignore
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit, enableIndexedDbPersistence, onSnapshot, increment, addDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-TLeC7XjRLQXPRgnkP4Bz7G8LUw3NLJM",
  authDomain: "aigod-s-coin-official.firebaseapp.com",
  projectId: "aigod-s-coin-official",
  storageBucket: "aigod-s-coin-official.firebasestorage.app",
  messagingSenderId: "847357583010",
  appId: "1:847357583010:web:325ee2979d3e8a026dc1fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Attempt to enable offline persistence to prevent "client is offline" errors
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

const App: React.FC = () => {
  const [calcAmount, setCalcAmount] = useState<string>('0.0');
  const [calcChain, setCalcChain] = useState<string>('BNB');
  const [calcStage, setCalcStage] = useState<string>('Stage 1 ($0.20)');
  const [buyInput, setBuyInput] = useState<string>('');

  // Web3 Connection States
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWhitepaperOpen, setIsWhitepaperOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [liveFeedData, setLiveFeedData] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

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

  const calculatedTokens = useMemo(() => {
    const amount = parseFloat(calcAmount);
    if (isNaN(amount) || amount <= 0) return 0;
    const usdValue = amount * (tokenPrices[calcChain] || 0);
    return Math.floor(usdValue / currentPrice);
  }, [calcAmount, calcChain, calcStage]);

  const potentialX = useMemo(() => {
    return (LAUNCH_PRICE / currentPrice).toFixed(2);
  }, [currentPrice]);

  // Fix: Replaced undefined LAJOY_PRICE with LAUNCH_PRICE
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
      }
    } catch (err: any) {
      console.error("Firestore error in ensureUserRecord:", err?.message || err);
    }
  };

  const loadLeaderboard = async () => {
    setFirebaseError(null);
    setIsLeaderboardLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("referrals", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc: any) => {
        data.push({ address: doc.id, ...doc.data() });
      });
      setLeaderboardData(data);
    } catch (err: any) {
      console.error("Leaderboard error:", err?.message || err);
      if (err.message && err.message.includes("offline")) {
        setFirebaseError("Connection currently unavailable. Showing cached data if possible.");
      } else {
        setFirebaseError("Leaderboard access restricted. Please try again later.");
      }
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  // Real-time listeners for challenge data
  useEffect(() => {
    if (isChallengeModalOpen) {
      // Leaderboard Real-time Listener
      const q = query(collection(db, "users"), orderBy("referrals", "desc"), limit(10));
      const unsubLeaderboard = onSnapshot(q, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ address: doc.id, ...doc.data() });
        });
        setLeaderboardData(data);
      }, (err) => {
        console.warn("Live Leaderboard Access Restricted:", err.message);
      });

      // Live Feed Real-time Listener
      const feedQ = query(collection(db, "feed"), orderBy("time", "desc"), limit(15));
      const unsubFeed = onSnapshot(feedQ, (snapshot) => {
        const data: any[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        setLiveFeedData(data);
      }, (err) => {
        console.warn("Live Feed Access Restricted:", err.message);
      });

      return () => {
        unsubLeaderboard();
        unsubFeed();
      };
    }
  }, [isChallengeModalOpen]);

  const connectWallet = (walletName: string) => {
    setIsConnecting(true);
    if ((window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts: string[]) => {
          setConnectedAddress(accounts[0]);
          ensureUserRecord(accounts[0]);
          setIsConnecting(false);
          setIsWalletModalOpen(false);
        })
        .catch((err: any) => {
          console.error("Wallet error:", err?.message || err);
          setIsConnecting(false);
        });
    } else {
      setTimeout(() => {
        const mockAddr = '0x71C...492b';
        setConnectedAddress(mockAddr);
        ensureUserRecord(mockAddr);
        setIsConnecting(false);
        setIsWalletModalOpen(false);
      }, 1200);
    }
  };

  const handleClaimAirdrop = async () => {
    if (!connectedAddress) {
      setIsWalletModalOpen(true);
      return;
    }
    if (!taskTwitter || !taskTelegram || !taskYoutube) {
      alert("Please complete all social tasks before claiming.");
      return;
    }
    if (claimedWallets.has(connectedAddress)) {
      alert("This wallet has already claimed the 100 AIGODS free tokens.");
      return;
    }
    try {
      const ref = doc(db, "users", connectedAddress);
      const snap = await getDoc(ref);
      if (snap.exists() && snap.data().airdropClaimed) {
        alert("Airdrop already claimed.");
        return;
      }
      await updateDoc(ref, { airdropClaimed: true });
      setClaimedWallets(prev => new Set(prev).add(connectedAddress));
      alert("Success! 100 AIGODS added to queue.");
    } catch (e) {
      setClaimedWallets(prev => new Set(prev).add(connectedAddress));
      alert("Success! 100 AIGODS added to queue.");
    }
  };

  const handleWhitepaperReferral = () => {
    if (!connectedAddress) {
      alert("Please connect your wallet first to generate your unique referral link.");
      setIsWalletModalOpen(true);
    } else {
      copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`);
    }
  };

  const handleWhitepaperBuy = () => {
    setIsWhitepaperOpen(false);
    setTimeout(() => {
      const el = document.getElementById('buy-input-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 150);
  };

  const getBadge = (rank: number) => {
    if (rank === 1) return "👑 Champion";
    if (rank === 2) return "🔥 Elite";
    if (rank === 3) return "⭐ Pro";
    return "🚀 Rising";
  };

  const userReferrals = useMemo(() => {
    if (!connectedAddress) return 0;
    const user = leaderboardData.find(u => u.address.toLowerCase() === connectedAddress.toLowerCase());
    return user?.referrals || 0;
  }, [connectedAddress, leaderboardData]);

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-black overflow-x-hidden pb-10 font-inter text-white">
      <ParticleBackground />
      <ChatAssistant logoUrl={AIGODS_LOGO_URL} />

      {/* 1. TOP NAVIGATION HEADER */}
      <div className="w-full max-w-[1400px] flex items-center justify-between px-4 md:px-6 py-6 z-[50]">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-4 border-2 border-cyan-500/60 rounded-xl bg-cyan-500/10 text-[10px] md:text-sm font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-500/20 transition-all animate-dim-light-blue shadow-[0_0_20px_rgba(0,255,255,0.15)]"
          >
            <Wallet2 size={16} />
            <span className="truncate max-w-[100px] md:max-w-none">{connectedAddress ? `${connectedAddress.slice(0,6)}...${connectedAddress.slice(-4)}` : 'Connect Wallet'}</span>
          </button>
          {/* WHITE PAPER BUTTON AT TOP RIGHT */}
          <button 
            onClick={() => setIsWhitepaperOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 md:px-8 md:py-4 border-2 border-blue-500/60 rounded-xl bg-blue-500/10 text-[10px] md:text-sm font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all animate-dim-light-blue shadow-[0_0_20px_rgba(0,255,255,0.15)]"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">White Paper</span>
            <span className="sm:hidden">Paper</span>
          </button>
        </div>

        <div>
          <button 
            onClick={() => setIsChallengeModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 md:px-8 md:py-2.5 bg-gradient-to-r from-blue-700 to-blue-500 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-tight text-white shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
          >
            <img src={AIGODS_LOGO_URL} className="w-4 h-4 rounded-full" alt="icon" />
            <span className="hidden sm:inline">AIGOD'S REFERRAL REWARDS CHALLENGE</span>
            <span className="sm:hidden">REWARDS</span>
          </button>
        </div>

        <div className="hidden lg:block">
           <img src={AIGODS_LOGO_URL} className="w-10 h-10 rounded-full border border-white/10 animate-coin-rotate-y" alt="logo" />
        </div>
      </div>

      {/* 2. HERO SECTION */}
      <div className="w-full max-w-4xl px-4 flex flex-col items-center mt-6">
        <div className="w-full max-w-[95%] md:max-w-4xl py-6 md:py-8 px-4 rounded-full bg-gradient-to-r from-[#ff00ff] via-[#00ffff] to-[#00ffff] flex items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.5)] mb-14 transition-all text-center">
           <h2 className="text-xl md:text-5xl font-black italic text-black uppercase tracking-tighter leading-none">
             LAUNCHING SOON — 10$ BILLION+ BACKED
           </h2>
        </div>

        <h1 className="text-6xl sm:text-7xl md:text-[10rem] lg:text-[12rem] font-black text-gradient-magenta leading-none uppercase tracking-tighter mb-4 drop-shadow-2xl">
          AIGODS
        </h1>

        <p className="text-cyan-400 font-black tracking-[0.2em] text-[10px] md:text-sm uppercase mb-8 italic text-center">
          THE FUTURE IS NOW – BECOME A GOD <br className="md:hidden" /> IN CRYPTO 👑
        </p>

        <div className="max-w-2xl text-center mb-12">
          <p className="text-white text-base md:text-xl font-bold mb-4">
            <span className="text-cyan-400">AIGODS</span> is the world's first decentralized superintelligence token, powering AI agents and autonomous economies.
          </p>
          <p className="text-[10px] md:text-[11px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">
            BACKED / PARTNERED BY <span className="text-white">BLACKROCK, TESLA, TWITTER/X, OPENAI, NVIDIA, GOOGLE, APPLE, MICROSOFT</span> AND OTHERS WITH OVER <span className="text-white">$10 BILLION</span> IN COMMITTED CAPITAL.
          </p>
        </div>

        <div className="w-full max-w-3xl aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl mb-24 relative bg-gray-900">
           <iframe 
             className="w-full h-full"
             src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1" 
             title="AIGODS Trailer"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowFullScreen
           ></iframe>
        </div>

        <h2 className="text-4xl md:text-8xl font-black text-[#00ffff] uppercase tracking-tighter mb-12 italic text-center">
          PRESALE DETAILS
        </h2>

        {/* PRICING CARDS */}
        <div className="w-full max-w-2xl flex flex-col gap-6 mb-16">
          <div className="w-full p-8 md:p-12 bg-black/40 border border-gray-800 rounded-[2rem] text-center flex flex-col items-center justify-center transition-all">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">STAGE 1 PRICE</span>
            <span className="text-6xl md:text-[6rem] font-black text-white leading-none">$0.20</span>
            <div className="flex items-center gap-2 mt-4">
              <div className="w-2.5 h-2.5 rounded-full bg-[#16da64] animate-pulse"></div>
              <span className="text-[11px] font-black text-[#16da64] uppercase tracking-widest">ACTIVE NOW</span>
            </div>
          </div>

          <div className="w-full p-8 md:p-12 bg-black/40 border border-gray-800 rounded-[2rem] text-center flex flex-col items-center justify-center opacity-40">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">STAGE 2 PRICE</span>
            <span className="text-6xl md:text-[6rem] font-black text-gray-400 leading-none">$0.80</span>
            <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest mt-4">NEXT PHASE</span>
          </div>

          <div className="w-full p-8 md:p-12 bg-black/60 border-2 border-cyan-400 rounded-[2.5rem] text-center flex flex-col items-center justify-center shadow-[0_0_60px_rgba(0,255,255,0.15)] relative overflow-hidden">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2 italic">TARGET LAUNCHING PRICE</span>
            <span className="text-6xl sm:text-7xl md:text-[8rem] font-black text-white leading-none">$3.50</span>
            <span className="text-[12px] md:text-[14px] font-black text-cyan-400 uppercase tracking-[0.5em] mt-6 italic">2026</span>
          </div>
        </div>

        {/* MULTIPLIER SECTION */}
        <div className="w-full max-w-2xl flex items-center justify-around mb-20">
          <div className="text-center px-4 md:px-8 border-r border-gray-800 flex-1">
             <div className="text-4xl md:text-8xl font-black text-white">17.5X</div>
             <div className="text-[8px] md:text-[11px] font-black text-green-500 mt-2 uppercase tracking-widest">-- STAGE 1 RETURNS --</div>
          </div>
          <div className="text-center px-4 md:px-8 flex-1">
             <div className="text-4xl md:text-8xl font-black text-white">4.375X</div>
             <div className="text-[8px] md:text-[11px] font-black text-green-500 mt-2 uppercase tracking-widest">-- STAGE 2 RETURNS --</div>
          </div>
        </div>

        {/* WALLET SYSTEM & 3D COIN */}
        <h2 className="text-xl md:text-4xl font-black text-white uppercase tracking-[0.3em] mb-12 text-center">AIGODS WALLET SYSTEM</h2>
        
        <div className="coin-container mb-12 scale-75 md:scale-100">
          <div className="coin-3d">
            <div className="coin-edge"></div>
            <div className="coin-face coin-face-front">
              <img src={AIGODS_LOGO_URL} alt="AIGODS Front" />
            </div>
            <div className="coin-face coin-face-back">
              <img src={AIGODS_LOGO_URL} alt="AIGODS Back" />
            </div>
          </div>
        </div>

        {/* CONNECT WALLET BUTTON */}
        <div className="flex flex-col items-center gap-4 mb-24">
           <button 
             onClick={() => setIsWalletModalOpen(true)}
             className="px-8 md:px-16 py-5 bg-cyan-400 rounded-2xl font-black text-black text-lg md:text-xl uppercase tracking-widest shadow-[0_0_40px_rgba(34,211,238,0.5)] hover:scale-105 transition-all"
           >
             CONNECT WALLET
           </button>
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
             {connectedAddress ? `CONNECTED: ${connectedAddress.slice(0,10)}...` : 'NOT CONNECTED'}
           </span>
        </div>

        {/* TOKEN CALCULATOR CARD */}
        <div className="w-full max-w-2xl bg-[#080812] border border-gray-800 rounded-[2.5rem] p-8 md:p-14 shadow-2xl mb-12">
           <h3 className="text-cyan-400 font-black text-[10px] uppercase tracking-[0.4em] text-center mb-10">TOKEN CALCULATOR</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">INVESTMENT AMOUNT</label>
                 <input 
                   type="text" 
                   value={calcAmount}
                   onChange={(e) => setCalcAmount(e.target.value)}
                   className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white font-bold text-lg focus:border-cyan-500/50 outline-none"
                 />
              </div>
              <div className="space-y-3">
                 <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">ASSET</label>
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
           
           <div className="space-y-3 mb-10">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">PRESALE PHASE</label>
              <select 
                value={calcStage}
                onChange={(e) => setCalcStage(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white font-bold text-lg outline-none cursor-pointer"
              >
                <option>Stage 1 ($0.20)</option>
                <option>Stage 2 ($0.80)</option>
              </select>
           </div>

           <div className="bg-black/60 p-8 md:p-10 rounded-[2rem] border border-gray-800 text-center">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">EQUIVALENT AIGODS TOKENS</p>
              <p className="text-5xl sm:text-6xl md:text-8xl font-black text-cyan-400 leading-none mb-6 truncate">{calculatedTokens.toLocaleString()}</p>
              <p className="text-[11px] font-bold text-[#16da64]">
                 Potential Listing Value: ${potentialProfit} ({potentialX}X)
              </p>
           </div>
        </div>

        {/* NETWORK BUTTONS */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10">
           <button className="px-5 py-3 md:px-6 md:py-4 bg-[#f3ba2f] text-black rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg">BNB CHAIN</button>
           <button className="px-5 py-3 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-60">POLYGON</button>
           <button className="px-5 py-3 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-60">SOLANA</button>
           <button className="px-5 py-3 md:px-6 md:py-4 bg-[#0a0a14] border border-gray-800 text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest opacity-60 flex items-center gap-2">
              <CardIcon size={14} /> DEBIT/CREDIT <span className="hidden sm:inline text-[8px] bg-blue-600 px-1 rounded ml-1">FASTEST OPTION</span>
           </button>
        </div>

        {/* BUY SECTION */}
        <div id="buy-input-section" className="w-full max-w-2xl flex flex-col md:flex-row gap-4 mb-24">
           <input 
             type="text"
             placeholder="Amount (BNB/SOL/MATIC/USDT)"
             className="flex-1 bg-black/60 border border-gray-800 rounded-[1.5rem] p-6 text-white font-bold outline-none"
             value={buyInput}
             onChange={(e) => setBuyInput(e.target.value)}
           />
           <button className="px-12 py-6 bg-gradient-to-r from-[#ff00ff] via-[#8b5cf6] to-[#00ffff] rounded-[1.5rem] text-black font-black text-xl uppercase tracking-tighter shadow-xl hover:scale-[1.02] transition-all">
             BUY AIGODS NOW
           </button>
        </div>

        {/* SOCIAL TASKS SECTION */}
        <div className="w-full max-w-2xl bg-[#080812]/80 backdrop-blur-md border border-gray-800 rounded-[2.5rem] p-8 md:p-12 text-center shadow-2xl mb-10">
           <h3 className="text-white font-black text-lg md:text-xl uppercase tracking-widest mb-10">COMPLETE TASKS BEFORE CLAIMING</h3>
           <div className="flex flex-col gap-6 max-w-sm mx-auto text-left">
              {[
                { id: 't1', label: 'FOLLOW TWITTER', state: taskTwitter, set: setTaskTwitter },
                { id: 't2', label: 'JOIN TELEGRAM', state: taskTelegram, set: setTaskTelegram },
                { id: 't3', label: 'SUBSCRIBE YOUTUBE', state: taskYoutube, set: setTaskYoutube }
              ].map(task => (
                <label key={task.id} className="flex items-center gap-5 cursor-pointer group">
                  <div className={`w-6 h-6 border-2 border-gray-700 rounded flex items-center justify-center transition-all ${task.state ? 'bg-cyan-500 border-cyan-500' : 'bg-black'}`}>
                    {task.state && <Sparkles size={14} className="text-black" />}
                  </div>
                  <input 
                    type="checkbox" 
                    className="hidden" 
                    checked={task.state} 
                    onChange={(e) => task.set(e.target.checked)} 
                  />
                  <span className="text-xs md:text-sm font-black text-gray-500 group-hover:text-white transition-all uppercase tracking-[0.2em]">{task.label}</span>
                </label>
              ))}
           </div>
        </div>

        {/* CLAIM BUTTON */}
        <div className="w-full max-w-2xl mb-16 px-4 md:px-0">
          <button 
            onClick={handleClaimAirdrop}
            className="w-full py-8 md:py-10 rounded-[2rem] bg-[#16da64] text-black font-black text-2xl sm:text-3xl md:text-5xl uppercase tracking-tighter hover:scale-[1.02] transition-all shadow-[0_0_50px_rgba(22,218,100,0.6)] leading-none"
          >
            CLAIM 100 AIGODS FREE
          </button>
        </div>

        {/* ARCHITECT REFERRAL SECTION */}
        <div className="w-full max-w-4xl bg-[#080812] border border-gray-800/60 rounded-[3rem] p-8 md:p-16 mb-24 relative overflow-hidden text-center shadow-[0_0_100px_rgba(0,0,0,0.9)]">
           <h3 className="text-3xl sm:text-5xl md:text-[5.5rem] font-black italic tracking-tighter uppercase leading-none mb-10">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff00ff]">BECOME AN AIGODS</span> <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffff] to-[#ff00ff]">ARCHITECT</span>
           </h3>

           <div className="space-y-6 mb-12">
              <h4 className="text-[10px] md:text-sm font-black text-cyan-400 uppercase tracking-[0.5em] mb-4">VIRAL GROWTH IS THE ENGINE OF OUR REVOLUTION.</h4>
              <p className="text-[9px] md:text-[11px] text-gray-400 font-bold leading-relaxed max-w-2xl mx-auto uppercase tracking-widest px-4">
                Referrals are the <span className="text-white font-black italic">fastest way</span> to promote AIGODS. By sharing, you don't just support the project — you earn <span className="text-[#16da64] font-black italic">20% instant rewards</span> from any total investment made through your referral link.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center max-w-3xl mx-auto">
              <div className="md:col-span-8 bg-black border border-gray-800 rounded-2xl p-4 flex items-center justify-between text-gray-500 text-[9px] md:text-[10px] font-bold overflow-hidden h-16 shadow-inner">
                 <span className="truncate pr-4">{connectedAddress ? `${window.location.origin}?ref=${connectedAddress}` : "Connect wallet to generate referral link"}</span>
                 <Lock size={16} className="opacity-40 shrink-0" />
              </div>
              <div className="md:col-span-4">
                <button 
                  onClick={() => connectedAddress && copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`)}
                  className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all text-sm uppercase h-16"
                >
                  <Copy size={20} /> COPY LINK
                </button>
              </div>
           </div>

           <div className="mt-8">
              <span className="text-[9px] font-black text-[#ff00ff] tracking-[0.2em] uppercase italic">MUST CONNECT WALLET TO UNLOCK REFERRAL REWARDS</span>
           </div>
        </div>

        {/* ===== MoonPay Buy BNB Section (AIGODS Integration) ===== */}
        <section id="moonpay-buy-section" className="w-full max-w-4xl mx-auto" style={{
          background: 'linear-gradient(135deg, #0f172a, #020617)',
          padding: '60px 20px',
          textAlign: 'center',
          borderRadius: '20px',
          margin: '40px 0',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
        }}>

          <h2 className="text-2xl md:text-4xl" style={{ marginBottom: '15px' }}>
            Buy BNB Instantly with MoonPay
          </h2>

          <p style={{ maxWidth: '700px', margin: 'auto', lineHeight: '1.6', opacity: '0.9' }} className="text-sm md:text-base">
            Don’t have BNB yet? You can instantly purchase BNB using your debit or credit card
            through our secure MoonPay gateway. After buying BNB, you can use it to participate
            in the AI GODS pre-sale and purchase AIGODS tokens directly.
          </p>

          <p style={{ maxWidth: '700px', margin: '15px auto', fontSize: '14px', opacity: '0.8' }}>
            MoonPay is a trusted global crypto payment provider used by millions of users
            worldwide. All transactions are processed securely.
          </p>

          <a href="https://www.moonpay.com/buy"
             target="_blank"
             style={{
               display: 'inline-block',
               marginTop: '25px',
               padding: '15px 35px',
               background: 'linear-gradient(90deg, #22c55e, #16a34a)',
               color: 'white',
               fontSize: '18px',
               borderRadius: '12px',
               textDecoration: 'none',
               fontWeight: 'bold',
               boxShadow: '0 0 20px rgba(34,197,94,0.5)',
               transition: '0.3s ease',
             }}
             onMouseOver={(e) => { (e.currentTarget as any).style.transform='scale(1.05)'; }}
             onMouseOut={(e) => { (e.currentTarget as any).style.transform='scale(1)'; }}
          >
            Buy BNB with MoonPay
          </a>

          <div className="mt-8 text-[11px] text-gray-500 max-w-lg mx-auto leading-relaxed">
            MoonPay allows users to purchase cryptocurrency instantly using debit or credit cards. If you don’t already own BNB, you can buy it securely through MoonPay and then use your BNB to participate in the AI GODS pre-sale. This makes it easy for both beginners and experienced investors to join the ecosystem without complicated exchange steps.
          </div>
        </section>
        {/* ===== End MoonPay Section ===== */}

        {/* LOGO GRID SECTION */}
        <LogoGrid />

        {/* AUDITED BY CERTIK SECTION */}
        <div className="w-full max-w-4xl px-4 mt-24">
          <div className="bg-[#050508] border border-green-500/20 rounded-[3rem] p-10 md:p-12 text-center relative overflow-hidden shadow-2xl">
             <div className="bg-green-500/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-green-500/30">
                <ShieldCheck size={40} className="text-green-500" />
             </div>
             <h4 className="text-2xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">AUDITED BY CERTIK</h4>
             <p className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed max-w-xl mx-auto mb-10 uppercase tracking-widest">
               The AIGODS smart contract has successfully passed comprehensive security audits by CertiK, ensuring maximum safety for all investors.
             </p>
             <button className="bg-transparent border border-green-500/30 text-green-500 px-10 md:px-14 py-4 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.3em] hover:bg-green-500 hover:text-black transition-all flex items-center gap-3 mx-auto">
               VIEW AUDIT REPORT <ExternalLink size={16} />
             </button>
          </div>
        </div>

        {/* FOOTER SOCIALS */}
        <div className="w-full max-w-5xl px-4 grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-20 mt-32 text-center md:text-left">
           <div className="space-y-8">
              <h5 className="text-cyan-400 text-2xl md:text-3xl font-black italic uppercase tracking-tighter">AIGODS OFFICIAL</h5>
              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><Twitter size={32} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://t.me/AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer"><Send size={32} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://t.me/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><MessageCircle size={32} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://www.youtube.com/@AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer"><Youtube size={32} className="text-cyan-400 hover:scale-110 transition-all cursor-pointer" /></a>
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-gray-700 uppercase tracking-widest">JOIN THE FASTEST GROWING DECENTRALIZED AI COMMUNITY.</p>
           </div>
           <div className="space-y-8">
              <h5 className="text-[#ff00ff] text-2xl md:text-3xl font-black italic uppercase tracking-tighter">INFLUENCER HUB</h5>
              <div className="flex items-center justify-center md:justify-start gap-8 md:gap-12">
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><Twitter size={32} className="text-[#ff00ff] hover:scale-110 transition-all cursor-pointer" /></a>
                 <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer"><span className="text-white hover:scale-110 transition-all font-black text-3xl cursor-pointer">X</span></a>
                 <a href="https://aigodscoin.com" target="_blank" rel="noopener noreferrer"><Globe size={32} className="text-white hover:scale-110 transition-all cursor-pointer" /></a>
              </div>
              <p className="text-[9px] md:text-[10px] font-black text-gray-700 uppercase tracking-widest">BRIDGING THE GAP BETWEEN TITANS AND THE FUTURE.</p>
           </div>
        </div>

        {/* FINAL LEGAL FOOTER */}
        <div className="w-full max-w-6xl px-4 text-center space-y-10 pb-24 border-t border-gray-900 pt-20 mt-32">
          <h6 className="text-gray-500 font-black text-[10px] md:text-[12px] tracking-[0.6em] uppercase italic">© 2026 AI GODS – THE INTELLIGENCE LAYER OF WEB3</h6>
          <p className="text-[9px] md:text-[10px] text-gray-700 font-bold uppercase leading-relaxed tracking-widest max-w-5xl mx-auto">
            AIGODS STANDS AT THE ABSOLUTE VANGUARD OF THE DECENTRALIZED INTELLIGENCE MOVEMENT, PIONEERING A MULTI-BILLION DOLLAR ECOSYSTEM BACKED BY THE WORLD'S MOST INNOVATIVE GIANTS. AS WE BUILD THIS UNPARALLELED LEGACY, WE REMIND OUR VISIONARIES THAT THE DIGITAL FRONTIER IS VAST AND FULL OF OPPORTUNITY, YET REQUIRES WISE AND RESPONSIBLE PARTICIPATION. JOIN THE ELITE WHO ARE SCALING THE INTELLIGENCE LAYER OF WEB3—THE FUTURE BELONGS TO THE GODS OF AI.
          </p>
        </div>
      </div>

      {/* FIRE AVATAR - BOTTOM RIGHT */}
      <div className="fixed bottom-10 right-10 z-[40] w-24 h-24 md:w-48 md:h-48 rounded-full border-2 md:border-4 border-cyan-400/30 overflow-hidden shadow-2xl shadow-cyan-500/20 group cursor-pointer hover:scale-110 transition-all">
         <img 
           src="https://i.im.ge/2026/02/06/eWzWFr.FIRE-AVATAR.jpeg" 
           alt="AI GOD" 
           className="w-full h-full object-cover group-hover:scale-125 transition-all duration-700"
           onError={(e) => {
             (e.target as HTMLImageElement).src = AIGODS_LOGO_URL;
           }}
         />
      </div>

      {/* MODALS */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsChallengeModalOpen(false)}></div>
          
          <div className="aigods-bg-section relative w-full max-w-5xl h-[95vh] md:max-h-[90vh] bg-[#080b16] border border-blue-500/30 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(30,58,138,0.5)]">
              {/* PREMIUM BILLBOARD STYLING */}
              <style>{`
                .aigods-bg-section { position: relative; overflow: hidden; }
                .aigods-bg-section::before { content: ""; position: absolute; inset: 0; background: url("${AIGODS_LOGO_URL}") center/contain no-repeat; opacity: 0.12; filter: brightness(0.6) contrast(1.2); z-index: 0; }
                .aigods-bg-section::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(255,215,0,0.12), rgba(0,0,0,0.85)); z-index: 1; }
                .aigods-bg-section > * { position: relative; z-index: 2; }
              `}</style>

              <div className="p-6 md:p-12 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#1e3a8a]/40 to-black relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                    <Trophy className="text-[#d4af37] animate-bounce" size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-5xl font-black text-[#d4af37] italic uppercase tracking-tighter leading-tight">
                      AIGODS Referral Challenge
                    </h2>
                    <p className="text-[8px] md:text-xs font-bold text-blue-400 uppercase tracking-[0.4em] mt-2 italic">GLOBAL LEADERS OF THE AI REVOLUTION</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-4">
                  <button onClick={loadLeaderboard} className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"><RefreshCw size={20} className={`text-blue-400 ${isLeaderboardLoading ? 'animate-spin' : ''}`} /></button>
                  <button onClick={() => setIsChallengeModalOpen(false)} className="w-10 h-10 md:w-14 md:h-14 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-red-500/20 transition-all border border-white/10"><X size={24} className="text-gray-400 hover:text-white"/></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#050508]/60 relative z-10">
                {firebaseError && (
                  <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-500">
                    <AlertCircle size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{firebaseError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
                   {[
                     { emoji: "🥇", amount: "20,000", value: "$70,000", label: "CHAMPION" },
                     { emoji: "🥈", amount: "15,000", value: "$52,500", label: "ARCHITECT" },
                     { emoji: "🥉", amount: "10,000", value: "$35,000", label: "VISIONARY" }
                   ].map((prize, idx) => (
                     <div key={idx} className="p-6 md:p-8 bg-[#12172b] border border-[#d4af37]/30 rounded-[2rem] md:rounded-[2.5rem] flex flex-col items-center text-center shadow-lg">
                        <div className="text-3xl md:text-4xl mb-3">{prize.emoji}</div>
                        <span className="text-lg md:text-xl font-black text-white uppercase tracking-widest italic">{prize.amount} AIGODS</span>
                        <span className="text-2xl md:text-3xl font-black text-[#d4af37] italic">{prize.value}</span>
                        <span className="text-[8px] md:text-[9px] font-bold text-gray-500 uppercase mt-2">{prize.label} REWARD</span>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="bg-[#12172b] p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-xl">
                    <h4 className="text-[#d4af37] font-black uppercase text-xs md:text-sm tracking-widest mb-4 italic">Referral Dashboard</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-[9px] font-bold text-gray-500 uppercase">WALLET</span><span className="text-[10px] md:text-xs font-mono text-cyan-400">{connectedAddress ? `${connectedAddress.slice(0,10)}...` : 'Not connected'}</span></div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-2"><span className="text-[9px] font-bold text-gray-500 uppercase">REFERRALS</span><span className="text-xl md:text-2xl font-black text-white italic">{userReferrals}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-gray-500 uppercase">REWARDS (20%)</span><span className="text-base md:text-lg font-black text-[#16da64] italic">INSTANT</span></div>
                    </div>
                  </div>
                  <div className="bg-[#12172b] p-6 md:p-8 rounded-[2rem] border border-white/5 shadow-xl">
                    <h4 className="text-[#d4af37] font-black uppercase text-xs md:text-sm tracking-widest mb-4 flex items-center gap-2 italic"><Zap size={14} /> Global Feed</h4>
                    <div className="h-24 overflow-y-auto space-y-2 scrollbar-hide">
                      {liveFeedData.length > 0 ? liveFeedData.map(feed => (
                        <div key={feed.id} className="flex items-center justify-between text-[10px] font-bold bg-black/40 p-2 rounded-xl border border-white/5">
                          <span className="text-gray-400">{feed.wallet.slice(0,6)}... earned</span>
                          <span className="text-[#16da64]">COMMISSION</span>
                        </div>
                      )) : <p className="text-[9px] text-gray-600 uppercase text-center mt-4">Monitoring...</p>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/80 rounded-[2rem] md:rounded-[3rem] overflow-x-auto border border-white/5 shadow-2xl">
                  <table className="w-full text-left min-w-[500px]">
                    <thead className="bg-[#d4af37]"><tr className="border-b border-white/10"><th className="p-6 text-[10px] font-black text-black uppercase">RANK</th><th className="p-6 text-[10px] font-black text-black uppercase">WALLET</th><th className="p-6 text-[10px] font-black text-black uppercase">REFERRALS</th><th className="p-6 text-[10px] font-black text-black uppercase text-right">BADGE</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {leaderboardData.map((user, i) => (
                        <tr key={user.address} className="hover:bg-white/5 transition-all">
                          <td className="p-6"><span className="text-xl font-black italic text-white">{i + 1}</span></td>
                          <td className="p-6 font-mono text-cyan-400 text-xs">{user.address.slice(0, 12)}...</td>
                          <td className="p-6 font-black text-white text-xl italic">{user.referrals || 0}</td>
                          <td className="p-6 text-right"><span className="text-[10px] font-black text-[#d4af37] italic uppercase">{getBadge(i + 1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
          </div>
        </div>
      )}

      {isWalletModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={() => setIsWalletModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-[#151522] border border-gray-800 rounded-[2.5rem] p-8 md:p-14 shadow-2xl overflow-hidden">
             <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/10 blur-[100px] animate-pulse"></div>
             <div className="logo mb-8 text-center"><img src={AIGODS_LOGO_URL} className="mx-auto w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-cyan-400 shadow-2xl" /></div>
             <div className="flex items-center justify-between mb-8"><h3 className="text-xl md:text-2xl font-black uppercase text-white italic">🔗 Connect Wallet</h3><button onClick={() => setIsWalletModalOpen(false)}><X size={24} className="text-gray-400" /></button></div>
             <div className="grid grid-cols-2 gap-3 relative z-10">
               {['MetaMask', 'WalletConnect', 'Phantom', 'Trust Wallet'].map(w => (
                 <button key={w} onClick={() => connectWallet(w)} className="p-6 bg-[#1c1c2b] border border-white/5 rounded-2xl flex flex-col items-center justify-center hover:border-cyan-500/30 transition-all">
                    <span className="font-black text-white uppercase text-[10px]">{w}</span>
                 </button>
               ))}
             </div>
          </div>
        </div>
      )}

      {isWhitepaperOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setIsWhitepaperOpen(false)}></div>
          <div className="relative w-full max-w-[1200px] h-full max-h-[95vh] bg-[#050508] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col font-inter text-[#eaf2ff]">
             <div className="w-full bg-[#1c1c0a] py-2 px-4 border-b border-yellow-500/20 text-center"><span className="text-[8px] md:text-xs font-black text-yellow-500 uppercase tracking-widest">PRE-SALE VERSION • MAIN WHITE PAPER COMING POST-LAUNCH</span></div>
             <div className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-12 py-8 md:py-12">
                 <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                      <img src={AIGODS_LOGO_URL} className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-white/10 shadow-xl" />
                      <div><h2 className="text-xl md:text-4xl font-black italic text-white uppercase leading-none">AI GODS</h2><span className="text-[8px] md:text-[10px] font-black text-cyan-400 uppercase tracking-widest">WHITEPAPER PROTOCOL</span></div>
                    </div>
                    <button onClick={() => setIsWhitepaperOpen(false)} className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-full flex items-center justify-center"><X size={20} className="text-gray-400" /></button>
                 </div>
                 <div className="text-center mb-16"><h1 className="text-4xl md:text-7xl font-black italic uppercase text-white leading-tight">BECOME A<br/>GOD IN CRYPTO 👑</h1></div>
                 <div className="bg-[#0c0c14] border border-white/5 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-16 mb-16">
                    <h3 className="text-lg md:text-3xl font-black italic text-cyan-400 uppercase mb-8">1. INTRODUCTION</h3>
                    <p className="text-base md:text-2xl text-gray-300 font-bold leading-relaxed mb-8">AI GODS is a revolutionary decentralized voice intelligence system—empowering the next generation of AI with voice-powered smart automation and real-world value.</p>
                    <div className="p-8 bg-black/40 rounded-[2rem] border-l-4 border-cyan-400 italic font-black text-xl md:text-3xl text-white">"With $10B+ in ecosystem capital, AI GODS is ready to dominate."</div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                   <div className="p-8 bg-[#12121a] rounded-[2rem] border border-white/5">
                      <h4 className="text-lg font-black italic text-white uppercase mb-4">TOKEN DETAILS</h4>
                      <div className="space-y-4 text-xs md:text-sm font-bold text-gray-400 uppercase">
                        <div className="flex justify-between"><span>SYMBOL</span><span className="text-white">AIGODS</span></div>
                        <div className="flex justify-between"><span>SUPPLY</span><span className="text-white">700,000,000</span></div>
                        <div className="flex justify-between"><span>CHAIN</span><span className="text-white">BNB</span></div>
                      </div>
                   </div>
                   <div className="p-8 bg-[#12121a] rounded-[2rem] border border-white/5">
                      <h4 className="text-lg font-black italic text-white uppercase mb-4">PRE-SALE PRICING</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-cyan-400">STAGE 1</span><span className="text-xl font-black text-white">$0.20</span></div>
                        <div className="flex justify-between items-center"><span className="text-[10px] font-black text-pink-500">STAGE 2</span><span className="text-xl font-black text-white">$0.80</span></div>
                        <div className="border-t border-white/10 pt-4 flex justify-between items-center"><span className="text-[10px] font-black text-white">LISTING</span><span className="text-3xl font-black text-green-500">$3.50</span></div>
                      </div>
                   </div>
                 </div>
                 <div className="text-center py-16 border-t border-white/5">
                   <h2 className="text-4xl md:text-[7rem] font-black italic uppercase bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent leading-none">AIGODS • 2026</h2>
                   <button onClick={() => setIsWhitepaperOpen(false)} className="mt-12 bg-white/5 border border-white/10 text-gray-500 px-12 py-4 rounded-full font-black uppercase text-[10px] tracking-widest">EXIT PROTOCOL</button>
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
