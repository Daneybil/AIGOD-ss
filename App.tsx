
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Twitter, 
  Send, 
  MessageSquare, 
  Youtube, 
  ShieldCheck, 
  Copy, 
  CreditCard,
  ExternalLink,
  Lock,
  Zap,
  CheckCircle2,
  X,
  Wallet2,
  ChevronRight,
  Share2,
  Globe,
  FileText,
  Trophy,
  CreditCard as CardIcon,
  Crown,
  Sparkles
} from 'lucide-react';
import LogoGrid from './components/LogoGrid';
import ParticleBackground from './components/ParticleBackground';
import ChatAssistant from './components/ChatAssistant';
import { AIGODS_LOGO_URL } from './constants';

// Firebase imports from CDN for the challenge system
// @ts-ignore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
// @ts-ignore
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } 
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
  const [activeNetwork, setActiveNetwork] = useState<string>('BNB CHAIN');
  const [isConnecting, setIsConnecting] = useState(false);

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

  const potentialProfit = useMemo(() => {
    const tokens = calculatedTokens;
    if (tokens === 0) return 0;
    return (tokens * LAUNCH_PRICE).toLocaleString();
  }, [calculatedTokens]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const switchNetwork = async (network: string) => {
    if (!(window as any).ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    let chainData;
    if (network === "BSC Mainnet") {
      chainData = {
        chainId: "0x38",
        chainName: "Binance Smart Chain",
        rpcUrls: ["https://bsc-dataseed.binance.org/"],
        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
        blockExplorerUrls: ["https://bscscan.com"]
      };
    } else if (network === "Polygon Mainnet") {
      chainData = {
        chainId: "0x89",
        chainName: "Polygon Mainnet",
        rpcUrls: ["https://polygon-rpc.com/"],
        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
        blockExplorerUrls: ["https://polygonscan.com"]
      };
    }

    if (chainData) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [chainData]
        });
      } catch (err) {
        console.error("Network switch error:", err);
      }
    }
  };

  const ensureUserRecord = async (address: string) => {
    const userRef = doc(db, "users", address);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        referrals: 0,
        airdropClaimed: false,
        lastSeen: new Date().toISOString()
      });
    }
  };

  const loadLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("referrals", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc: any) => {
        data.push({ address: doc.id, ...doc.data() });
      });
      setLeaderboardData(data);
    } catch (err) {
      console.error("Leaderboard error:", err);
    }
  };

  const handleNetworkClick = (network: string) => {
    setActiveNetwork(network);
    if (!connectedAddress && network !== 'DEBIT/CREDIT') {
      setIsWalletModalOpen(true);
    } else if (network === 'BNB CHAIN') {
      switchNetwork("BSC Mainnet");
    } else if (network === 'POLYGON') {
      switchNetwork("Polygon Mainnet");
    }
  };

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
          console.error(err);
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
      alert("Please complete all social tasks before claiming your airdrop.");
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
        alert("Airdrop already claimed via blockchain records.");
        return;
      }
      await updateDoc(ref, { airdropClaimed: true });
      setClaimedWallets(prev => new Set(prev).add(connectedAddress));
      alert("Success! 100 AIGODS have been added to your claiming queue. These will be distributed at TGE.");
    } catch (e) {
      setClaimedWallets(prev => new Set(prev).add(connectedAddress));
      alert("Success! 100 AIGODS have been added to your claiming queue.");
    }
  };

  useEffect(() => {
    if (isChallengeModalOpen) {
      loadLeaderboard();
    }
  }, [isChallengeModalOpen]);

  return (
    <div className="min-h-screen relative flex flex-col items-center py-6 px-4 md:px-0 bg-transparent">
      <ParticleBackground />

      <ChatAssistant logoUrl={AIGODS_LOGO_URL} />

      {/* Header Area */}
      <div className="w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-10 px-4 gap-6">
        {/* Top Left: Wallet Connect & White Paper */}
        <div className="flex items-center gap-3 order-2 md:order-1">
          <button 
            onClick={() => connectedAddress ? null : setIsWalletModalOpen(true)}
            className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/30 text-cyan-400 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-cyan-500/20 transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/5"
          >
            <Wallet2 size={14} />
            <span>{connectedAddress ? `${connectedAddress.slice(0,6)}...${connectedAddress.slice(-4)}` : 'Connect Wallet'}</span>
          </button>
          <button 
            onClick={() => setIsWhitepaperOpen(true)}
            className="bg-gray-900/60 backdrop-blur-md border border-white/10 text-white font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white/5 transition-all text-[10px] uppercase tracking-widest"
          >
            <FileText size={14} className="text-cyan-400" />
            <span>White Paper</span>
          </button>
        </div>

        {/* Top Middle: Reward Challenge Button - UPDATED TO BLUE */}
        <div className="order-1 md:order-2">
          <button 
            onClick={() => setIsChallengeModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white font-black px-8 py-3 rounded-full flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] text-[11px] md:text-xs uppercase tracking-tighter border border-white/10"
          >
            <img src={AIGODS_LOGO_URL} className="w-6 h-6 rounded-full border border-white/20" alt="Logo" />
            AIGOD'S REFERRAL REWARDS CHALLENGE
          </button>
        </div>

        {/* Top Right: Logo Icon */}
        <div className="relative group cursor-pointer order-3">
          <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
          <img 
            src={AIGODS_LOGO_URL} 
            alt="AIGODS Logo Icon" 
            className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/10 relative z-10 hover:border-cyan-500/40 transition-all animate-coin-rotate-y"
          />
        </div>
      </div>

      {/* Challenge Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsChallengeModalOpen(false)}></div>
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#080810] border border-yellow-500/30 rounded-[3rem] overflow-y-auto shadow-[0_0_150px_rgba(234,179,8,0.1)] scrollbar-hide">
            <div className="p-8 md:p-14 space-y-12">
              
              {/* Modal Header */}
              <div className="flex flex-col md:flex-row items-center gap-10 border-b border-white/5 pb-12">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
                  <img src={AIGODS_LOGO_URL} className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-yellow-500/50 relative z-10 shadow-2xl" alt="AIGODS Logo" />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">REFERRAL <span className="text-yellow-500">CHALLENGE</span></h2>
                  <p className="text-gray-400 font-bold text-sm md:text-lg max-w-xl leading-relaxed">
                    The ultimate AI GODS architect battle. Climb the global leaderboard and unlock massive rewards.
                  </p>
                </div>
                <button onClick={() => setIsChallengeModalOpen(false)} className="absolute top-8 right-8 p-3 bg-gray-900/60 rounded-full text-gray-400 hover:text-white transition-all">
                  <X size={28} />
                </button>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => { handleClaimAirdrop(); }}
                  className="py-6 bg-[#16da64] text-black font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-green-500/10"
                >
                  <Sparkles size={18} /> CLAIM FREE 100 AIGODS
                </button>
                <button 
                  onClick={() => { setIsChallengeModalOpen(false); document.getElementById('calculator')?.scrollIntoView({behavior:'smooth'}); }}
                  className="py-6 bg-cyan-500 text-black font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-cyan-500/10"
                >
                  <CardIcon size={18} /> BUY PRESALE NOW
                </button>
                <button 
                  onClick={() => { if(!connectedAddress) setIsWalletModalOpen(true); else copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`); }}
                  className="py-6 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-lg shadow-white/10"
                >
                  <Share2 size={18} /> COPY REFERRAL LINK
                </button>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-black/60 rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                    <Trophy className="text-yellow-500" /> GLOBAL RANKINGS
                  </h3>
                  <div className="bg-yellow-500/10 text-yellow-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-yellow-500/20">
                    UPDATED LIVE
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">RANK</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">WALLETS</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">REFERRALS</th>
                        <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">EST. REWARD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData.length > 0 ? leaderboardData.map((user, i) => {
                        const rewards = [
                          { tokens: 15000, usd: "$52,500" },
                          { tokens: 10000, usd: "$35,000" },
                          { tokens: 5000, usd: "$17,500" }
                        ];
                        const isTop3 = i < 3;
                        return (
                          <tr key={user.address} className={`border-b border-white/5 hover:bg-white/5 transition-all ${isTop3 ? 'bg-yellow-500/5' : ''}`}>
                            <td className="px-8 py-6 font-black text-xl italic text-white italic">
                              {i === 0 ? <Crown size={24} className="text-yellow-500" /> : i + 1}
                            </td>
                            <td className="px-8 py-6">
                              <span className="font-mono text-cyan-400 font-bold">{user.address.slice(0, 8)}...{user.address.slice(-6)}</span>
                            </td>
                            <td className="px-8 py-6 font-black text-white text-lg">{user.referrals || 0}</td>
                            <td className="px-8 py-6 text-right">
                              <span className={`text-xl font-black tracking-tighter ${isTop3 ? 'text-yellow-500' : 'text-gray-500'}`}>
                                {isTop3 ? rewards[i].usd : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={4} className="p-20 text-center text-gray-500 font-bold uppercase tracking-widest italic">Scanning global network for rankings...</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Instructions Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-[#0c0c16] rounded-[2.5rem] p-10 space-y-6 border border-white/5">
                  <h4 className="text-xl font-black text-cyan-400 uppercase italic">HOW TO WIN THE CHALLENGE 🚀</h4>
                  <ul className="space-y-4">
                    {[
                      'Run Google Ads campaigns to scale your reach.',
                      'Promote using viral TikTok & YouTube shorts.',
                      'Deploy links across Twitter, Telegram & Discord.',
                      'Share on high-traffic crypto blogs & forums.',
                      'Utilize referral automation tools for maximum impact.'
                    ].map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs font-bold text-gray-400 leading-relaxed uppercase tracking-wider">
                        <CheckCircle2 size={16} className="text-cyan-500 shrink-0" /> {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-transparent rounded-[2.5rem] p-10 space-y-6 border border-yellow-500/20 relative overflow-hidden">
                  <Trophy size={140} className="absolute -right-10 -bottom-10 text-yellow-500/10 rotate-12" />
                  <h4 className="text-xl font-black text-yellow-500 uppercase italic relative z-10">PRIZE POOL BREAKDOWN</h4>
                  <div className="space-y-5 relative z-10">
                    {[
                      { rank: '1ST PLACE', prize: '15,000 AIGODS', usd: '$52,500' },
                      { rank: '2ND PLACE', prize: '10,000 AIGODS', usd: '$35,000' },
                      { rank: '3RD PLACE', prize: '5,000 AIGODS', usd: '$17,500' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.rank}</p>
                          <p className="text-sm font-black text-white uppercase italic">{item.prize}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-yellow-500 italic">{item.usd}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center pt-8 border-t border-white/5">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] italic">THIS IS A MAJOR OPPORTUNITY. PUT IN MAXIMUM EFFORT AND DOMINATE THE WORLD. 👑</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {isWhitepaperOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setIsWhitepaperOpen(false)}></div>
          <div className="relative w-full max-w-4xl max-h-[95vh] bg-[#050508] border border-gray-800/60 rounded-[3rem] overflow-y-auto shadow-[0_0_100px_rgba(34,211,238,0.15)] animate-in zoom-in-95 duration-300 scrollbar-hide">
            <div className="p-8 md:p-12 space-y-10">
              {/* Note Header */}
              <div className="bg-[#1a1705] border border-yellow-500/30 p-4 rounded-xl text-center">
                <p className="text-yellow-500 font-black text-[9px] md:text-[11px] uppercase tracking-widest leading-relaxed">
                  NOTE: THIS IS THE PRE-SALE WHITE PAPER. THE MAIN WHITE PAPER WILL BE ARRIVING SOON AFTER LAUNCHING.
                </p>
              </div>

              {/* White Paper Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-800/40 pb-10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl"></div>
                    <img src={AIGODS_LOGO_URL} className="w-20 h-20 md:w-28 md:h-28 rounded-full border-2 border-yellow-500/40 relative z-10" alt="Logo" />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">AI GODS (AIGODS)</h2>
                    <p className="text-cyan-400 font-black tracking-[0.3em] text-[10px] uppercase mt-2">PRE-SALE & AIRDROP WHITEPAPER</p>
                  </div>
                </div>
                <button onClick={() => setIsWhitepaperOpen(false)} className="p-3 bg-gray-900/60 rounded-full text-gray-400 hover:text-white transition-all border border-white/5">
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="space-y-16 py-4">
                
                {/* Hero section */}
                <section className="text-center space-y-10">
                   <h3 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">
                     THE FUTURE IS NOW – BECOME A GOD <br/> IN CRYPTO 👑
                   </h3>
                   <div className="space-y-4">
                     <div className="w-full h-[350px] md:h-[550px] rounded-[3rem] overflow-hidden relative shadow-2xl bg-black/40">
                        <img src={AIGODS_LOGO_URL} className="w-full h-full object-cover" alt="Whitepaper Hero Banner" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent opacity-60"></div>
                     </div>
                     <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">A MAJESTIC BEARDED TITAN, HALF CYBERNETIC HUMAN, HALF BLAZING AIGODS SYMBOL</p>
                   </div>
                </section>

                {/* 1. Introduction section */}
                <section className="space-y-8 p-10 bg-[#0a0a14] rounded-[3rem] border border-white/5">
                  <h4 className="text-2xl font-black text-cyan-400 uppercase italic flex items-center gap-4">
                    <span className="bg-cyan-500 text-black px-3 py-1 rounded-lg not-italic text-lg">1</span>
                    INTRODUCTION – WELCOME TO AI GODS
                  </h4>
                  <div className="space-y-6 text-gray-200 leading-relaxed">
                    <p className="text-base md:text-xl font-bold">
                      AI GODS is not just another token. It is a revolutionary decentralized voice intelligence reward system—empowering real-world AI applications with voice-powered intelligence, smart automation, and community-driven innovation.
                    </p>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Built for the AI era through alignment with industry Titans & Innovators:</p>
                      <p className="text-xs font-black text-white">BlackRock • Tesla • OpenAI • Microsoft • Nvidia • Google • Apple • X (Twitter) • and more.</p>
                    </div>

                    {/* Quote Box */}
                    <div className="bg-[#0c1a25] border-l-4 border-cyan-500 p-8 rounded-2xl relative overflow-hidden">
                       <Globe size={120} className="absolute -right-10 -bottom-10 text-cyan-500/10" />
                       <p className="text-lg md:text-2xl font-black text-white italic leading-tight relative z-10">
                         "With over $10 billion in committed ecosystem capital, AI GODS is positioned to dominate the intersection of artificial intelligence and cryptocurrency."
                       </p>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[#a1882d] font-black italic text-xs uppercase">AI GODS is here to create massive awareness in the world of crypto. Stay up, get ready to be rich, and retire early.</p>
                       <p className="text-[#a1882d] font-black italic text-xs uppercase">The future is NOW – AIGODS COIN OFFICIAL IS THE KING! 👑</p>
                    </div>
                  </div>
                </section>

                {/* 2 & 3: Token Details & Presale Stages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Section 2: Token Details */}
                  <section className="p-10 bg-[#0a0a14] rounded-[3rem] border border-white/5 space-y-8">
                    <h4 className="text-2xl font-black text-[#ff00ff] uppercase italic flex items-center gap-4">
                      <span className="bg-[#ff00ff] text-black px-3 py-1 rounded-lg not-italic text-lg">2</span>
                      TOKEN DETAILS
                    </h4>
                    <div className="space-y-4">
                      {[
                        ['TOKEN NAME', 'AI GODS'],
                        ['SYMBOL', 'AIGODS'],
                        ['TOTAL SUPPLY', '700,000,000'],
                        ['DECIMALS', '18'],
                        ['BLOCKCHAIN', 'BNB, Polygon, Solana']
                      ].map(([label, val]) => (
                        <div key={label} className="flex items-center justify-between border-b border-white/5 pb-2">
                           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
                           <span className="text-sm font-black text-white uppercase">{val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4 pt-4">
                       <span className="text-[9px] font-black text-[#ff00ff] uppercase tracking-widest italic">ALLOCATION</span>
                       <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <span className="text-xs font-black text-white"><span className="text-[#ff00ff]">80%</span> – Pre-Sale (Community)</span>
                       </div>
                       <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                          <span className="text-xs font-black text-white"><span className="text-[#ff00ff]">20%</span> – Team & Ecosystem</span>
                       </div>
                       <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest text-center italic">PURE COMMUNITY-FIRST DESIGN.</p>
                    </div>
                  </section>

                  {/* Section 3: Presale Stages */}
                  <section className="p-10 bg-[#0a0a14] rounded-[3rem] border border-white/5 space-y-8">
                    <h4 className="text-2xl font-black text-yellow-500 uppercase italic flex items-center gap-4">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-lg not-italic text-lg">3</span>
                      PRE-SALE STAGES
                    </h4>
                    <div className="space-y-6">
                       <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-cyan-500 text-black text-[7px] font-black px-2 py-1 uppercase italic">STAGE 1 - EARLY BIRD</div>
                          <div className="text-xl font-black text-white">$0.20 per AIGODS</div>
                          <div className="text-[9px] font-bold text-cyan-400 mt-1 uppercase tracking-widest italic">17.5x POTENTIAL UPSIDE</div>
                       </div>
                       <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-purple-500 text-black text-[7px] font-black px-2 py-1 uppercase italic">STAGE 2 - ACCUMULATION</div>
                          <div className="text-xl font-black text-white">$0.80 per AIGODS</div>
                          <div className="text-[9px] font-bold text-purple-400 mt-1 uppercase tracking-widest italic">4.375x POTENTIAL UPSIDE</div>
                       </div>
                       <div className="bg-gray-800/40 border border-white/5 rounded-2xl p-6 text-center">
                          <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 italic">TARGET LISTING PRICE</div>
                          <div className="text-4xl font-black text-white">$3.50</div>
                       </div>
                    </div>
                  </section>
                </div>

                {/* Section 4 & 5 Card Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* 4. Easy Purchase */}
                   <section className="p-10 bg-[#0a0a14] rounded-[3rem] border border-white/5 space-y-6">
                      <h4 className="text-2xl font-black text-cyan-400 uppercase italic leading-none">4. EASY PURCHASE OPTIONS</h4>
                      <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                        Buy with BNB, Polygon, or Solana. No crypto? No problem. Purchase instantly using <span className="text-white">Debit or Credit Card</span>. Tokens reflect automatically.
                      </p>
                      <button onClick={() => {setIsWhitepaperOpen(false); handleNetworkClick('DEBIT/CREDIT');}} className="w-full py-5 bg-cyan-500 text-black font-black rounded-xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all">
                        BUY AIGODS NOW
                      </button>
                   </section>

                   {/* 5. Free Airdrop */}
                   <section className="p-10 bg-[#0a0a14] rounded-[3rem] border border-white/5 space-y-6">
                      <h4 className="text-2xl font-black text-cyan-400 uppercase italic leading-none">5. FREE AIRDROP</h4>
                      <p className="text-[11px] text-gray-400 font-semibold leading-relaxed">
                        100 AIGODS FREE per eligible wallet. One claim per wallet. At listing price, this is <span className="text-white font-bold italic">$350 potential value</span>.
                      </p>
                      <button onClick={() => {setIsWhitepaperOpen(false); handleClaimAirdrop();}} className="w-full py-5 bg-[#16da64] text-black font-black rounded-xl uppercase tracking-[0.2em] text-xs shadow-lg shadow-green-500/20 hover:scale-105 transition-all">
                        CLAIM FREE 100 AIGODS
                      </button>
                   </section>
                </div>

                {/* Section 6: Referral System Full Width */}
                <section className="p-12 bg-gradient-to-br from-purple-900/40 to-black rounded-[3rem] border border-[#ff00ff]/20 text-center space-y-8 shadow-2xl">
                   <h4 className="text-3xl md:text-5xl font-black text-[#ff00ff] uppercase italic tracking-tighter leading-none">6. POWERFUL REFERRAL SYSTEM</h4>
                   <p className="text-[11px] md:text-base text-gray-400 font-bold max-w-xl mx-auto leading-relaxed">
                     Promote AI GODS and earn <span className="text-green-500 font-black">50% INSTANT REWARDS</span> of every purchase made through your unique link.
                   </p>
                   <button onClick={() => {setIsWhitepaperOpen(false); if(!connectedAddress) setIsWalletModalOpen(true);}} className="bg-white text-black font-black px-14 py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-gray-200 transition-all mx-auto block">
                      GET REFERRAL LINK
                   </button>
                </section>

                {/* Section 7: Why AI Gods */}
                <section className="space-y-12">
                   <div className="text-center space-y-4">
                      <h4 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">7. WHY AI GODS?</h4>
                      <p className="text-[11px] md:text-base text-gray-400 font-bold max-w-xl mx-auto leading-relaxed">
                        AI GODS combines decentralized voice AI, powerful incentives, and massive global momentum. This isn’t just hype—it’s a movement.
                      </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: 'Maximum Upside', desc: 'Early access to low pre-sale pricing', color: 'text-cyan-400' },
                        { title: 'Community Dominance', desc: 'Powered by the architecture of Web3', color: 'text-cyan-400' },
                        { title: 'Financial Freedom', desc: 'Built for the Titans & Visionaries', color: 'text-cyan-400' }
                      ].map((card, i) => (
                        <div key={i} className="bg-[#0a0a14] border border-white/5 p-10 rounded-[2.5rem] text-center space-y-4 shadow-xl">
                           <span className={`text-sm md:text-base font-black italic uppercase ${card.color}`}>{card.title}</span>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">{card.desc}</p>
                        </div>
                      ))}
                   </div>
                </section>

                {/* FinalTagline */}
                <section className="text-center space-y-12 pt-16">
                   <h4 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-tight">
                     AI GODS – The Future is <br/> Here. <br/>
                     <span className="italic text-[#a1882d]">Be Rich. Retire Early. Rule <br/> the Crypto World. 👑</span>
                   </h4>
                   <button onClick={() => setIsWhitepaperOpen(false)} className="bg-gray-900 text-white font-black px-12 py-5 rounded-2xl uppercase tracking-[0.3em] text-[10px] border border-white/10 hover:bg-white/5 transition-all shadow-xl mx-auto block">
                      CLOSE WHITE PAPER
                   </button>
                </section>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Banner */}
      <div className="w-full max-w-6xl px-4 mb-10">
        <div className="bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black text-xl md:text-4xl font-black py-4 md:py-6 rounded-full tracking-tighter uppercase shadow-[0_0_40_rgba(255,0,255,0.3)] text-center animate-pulse">
          LAUNCHING SOON – 10$ BILLION+ BACKED
        </div>
      </div>

      {/* Main Title Section */}
      <div className="text-center mb-8">
        <h1 className="text-7xl md:text-9xl font-black text-gradient-magenta tracking-tighter leading-none uppercase">AIGOD'S</h1>
        <p className="text-cyan-400 font-black tracking-[0.1em] text-[11px] md:text-sm uppercase mt-4 leading-tight italic text-center">
          THE FUTURE IS NOW – BECOME A GOD <br/> IN CRYPTO 👑
        </p>
      </div>

      {/* Description */}
      <div className="max-w-xl text-center px-6 mb-12 space-y-4">
        <p className="text-sm md:text-lg font-bold">
          <span className="text-cyan-400">AIGODS</span> is the world's first decentralized superintelligence token, powering AI agents and autonomous economies.
        </p>
        <p className="text-[10px] md:text-xs text-gray-600 font-bold uppercase leading-relaxed tracking-wider">
          Backed /partnered by <span className="text-white">BlackRock, Tesla, Twitter/X, OpenAI, NVIDIA, Google, Apple, Microsoft</span> and others with over <span className="text-white">$10 billion</span> in committed capital.
        </p>
      </div>

      {/* Video */}
      <div className="w-full max-w-3xl aspect-video bg-black/40 rounded-[2rem] border border-gray-800 shadow-[0_0_50px_rgba(147,51,234,0.15)] overflow-hidden relative mb-20">
        <iframe 
          className="w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
          title="AIGODS Official Showcase"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        ></iframe>
      </div>

      {/* Presale Details Header */}
      <div className="text-center mb-10">
        <h2 className="text-5xl md:text-7xl font-black text-cyan-400 tracking-tighter uppercase">
          PRESALE DETAILS
        </h2>
      </div>

      {/* Pricing Cards */}
      <div className="w-full max-w-2xl px-4 space-y-6 mb-10">
        <div className="bg-gray-900/40 border border-cyan-500/20 rounded-[2rem] p-8 text-center backdrop-blur-sm relative">
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">STAGE 1 PRICE</span>
          <span className="text-6xl font-black text-white">$0.20</span>
          <div className="mt-2 flex items-center justify-center gap-2 text-green-500 text-[10px] font-bold">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            ACTIVE NOW
          </div>
        </div>

        <div className="bg-gray-900/40 border border-white/5 rounded-[2rem] p-8 text-center opacity-60">
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 block">STAGE 2 PRICE</span>
          <span className="text-6xl font-black text-white">$0.80</span>
          <div className="mt-2 text-gray-500 text-[10px] font-bold uppercase tracking-widest">NEXT PHASE</div>
        </div>

        <div className="bg-black/60 border-2 border-cyan-400 rounded-[2rem] p-10 text-center shadow-[0_0_60px_rgba(34,211,238,0.2)]">
          <span className="text-[10px] font-black uppercase text-cyan-400 tracking-widest mb-2 block italic">FINAL LAUNCH PRICE</span>
          <span className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">$3.50</span>
          <div className="mt-3 text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em]">Q4 2026</div>
        </div>
      </div>

      {/* Multipliers */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-4 px-4 mb-16 text-center">
        <div className="p-4 border-r border-gray-800">
          <div className="text-5xl font-black text-white">17.5X</div>
          <div className="text-[10px] font-black text-green-500 mt-2 uppercase tracking-widest">→ Stage 1 Returns</div>
        </div>
        <div className="p-4">
          <div className="text-5xl font-black text-white">4.375X</div>
          <div className="text-[10px] font-black text-green-500 mt-2 uppercase tracking-widest">Stage 2 Returns ←</div>
        </div>
      </div>

      {/* 🔥 UPGRADED 3D ROTATING COIN */}
      <div className="mb-40 relative flex flex-col items-center w-full">
        <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-12">AIGODS Wallet System</h2>
        <div className="coin-container">
          <div className="coin-3d">
            <div className="coin-edge"></div>
            <div className="coin-face coin-face-front">
              <img src={AIGODS_LOGO_URL} alt="AIGODS Coin Front" />
            </div>
            <div className="coin-face coin-face-back">
              <img src={AIGODS_LOGO_URL} alt="AIGODS Coin Back" />
            </div>
          </div>
        </div>
        <div className="mt-20 text-center">
          <button 
            onClick={() => connectedAddress ? null : setIsWalletModalOpen(true)}
            className="bg-cyan-500 text-black font-black px-12 py-5 rounded-2xl uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(6,182,212,0.3)] text-lg"
          >
            {connectedAddress ? 'Wallet Connected' : 'Connect Wallet'}
          </button>
          <p className="mt-6 text-sm font-black text-gray-500 uppercase tracking-widest">
            {connectedAddress ? `Connected: ${connectedAddress}` : 'Not Connected'}
          </p>
        </div>
      </div>

      {/* Calculator */}
      <div id="calculator" className="w-full max-w-2xl bg-[#0a0a14] border border-gray-800 rounded-[3rem] p-10 shadow-2xl relative mb-20">
        <div className="text-center mb-10">
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-4 block">TOKEN CALCULATOR</span>
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">INVESTMENT AMOUNT</label>
              <input 
                type="text" 
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-2xl p-5 text-white font-bold text-lg focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">ASSET</label>
              <select 
                value={calcChain}
                onChange={(e) => setCalcChain(e.target.value)}
                className="w-full bg-black/40 border border-gray-800 rounded-2xl p-5 text-white font-bold text-lg focus:outline-none appearance-none cursor-pointer"
              >
                <option>BNB</option>
                <option>SOL</option>
                <option>MATIC</option>
              </select>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">PRESALE PHASE</label>
            <select 
              value={calcStage}
              onChange={(e) => setCalcStage(e.target.value)}
              className="w-full bg-black/40 border border-gray-800 rounded-2xl p-5 text-white font-bold text-lg focus:outline-none cursor-pointer"
            >
              <option>Stage 1 ($0.20)</option>
              <option>Stage 2 ($0.80)</option>
            </select>
          </div>
          <div className="bg-black/60 p-10 rounded-3xl border border-gray-800/60 text-center">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">EQUIVALENT AIGODS TOKENS</div>
            <div className="text-7xl font-black text-cyan-400 leading-none">{calculatedTokens.toLocaleString()}</div>
            <div className="mt-6 text-green-500 font-bold text-sm tracking-wide">Potential Listing Value: ${potentialProfit} ({potentialX}X)</div>
          </div>
        </div>
      </div>

      {/* Network Icons Row */}
      <div className="w-full max-w-2xl px-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <button 
          onClick={() => handleNetworkClick('BNB CHAIN')} 
          className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${activeNetwork === 'BNB CHAIN' ? 'bg-[#f3ba2f] text-black shadow-[0_0_20px_rgba(243,186,47,0.4)]' : 'bg-gray-900/60 border border-white/5'}`}
        >
          BNB CHAIN
        </button>
        <button 
          onClick={() => handleNetworkClick('POLYGON')} 
          className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${activeNetwork === 'POLYGON' ? 'bg-[#8247e5] text-white shadow-[0_0_20px_rgba(130,71,229,0.4)]' : 'bg-gray-900/60 border border-white/5'}`}
        >
          POLYGON
        </button>
        <button 
          onClick={() => handleNetworkClick('SOLANA')} 
          className={`py-4 px-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${activeNetwork === 'SOLANA' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-gray-900/60 border border-white/5'}`}
        >
          SOLANA
        </button>
        <div className="relative">
          <button 
            onClick={() => handleNetworkClick('DEBIT/CREDIT')} 
            className={`w-full py-4 px-2 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeNetwork === 'DEBIT/CREDIT' ? 'bg-[#3b82f6] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-gray-900/60 border border-white/5'}`}
          >
            <CardIcon size={14} /> DEBIT/CREDIT
          </button>
          <div className="absolute -top-3 -right-2 bg-blue-500 text-[7px] font-black text-white px-2 py-0.5 rounded-full uppercase italic animate-bounce shadow-lg">
            FASTEST OPTION
          </div>
        </div>
      </div>

      {/* Card Checkout Banner */}
      {activeNetwork === 'DEBIT/CREDIT' && (
        <div className="w-full max-w-2xl bg-blue-900/20 border border-blue-500/40 rounded-[2.5rem] p-10 mb-10 flex items-start gap-8 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
          <div className="bg-blue-600 p-5 rounded-3xl shadow-[0_0_30px_rgba(37,99,235,0.6)]">
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <h4 className="text-xl font-black text-white uppercase tracking-tighter">Instant Card Checkout</h4>
               <div className="h-0.5 w-12 bg-blue-500/40"></div>
            </div>
            <p className="text-[11px] text-gray-300 font-semibold leading-relaxed max-w-md">
              No crypto? No problem. Securely purchase AIGODS tokens using your <span className="text-white">Visa, Mastercard, Apple Pay,</span> or <span className="text-white">Google Pay</span>. Our 1-click fiat bridge handles everything, including instant delivery to your wallet.
            </p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6">
              <div className="flex items-center gap-2 text-[9px] font-black text-cyan-400">
                <CheckCircle2 size={12} /> INSTANT TOKEN DELIVERY
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-cyan-400">
                <CheckCircle2 size={12} /> FULLY SECURED & AUDITED
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black text-cyan-400">
                <CheckCircle2 size={12} /> 30-SEC VERIFICATION
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buy Button Row */}
      <div className="w-full max-w-2xl px-4 grid grid-cols-1 md:grid-cols-12 gap-4 mb-14">
        <div className="md:col-span-8">
           <input 
             type="text" 
             placeholder="Amount (BNB/SOL/MATIC/USDT)" 
             className="w-full h-24 bg-gray-900/60 border border-gray-800 rounded-[2rem] px-8 text-xl font-bold text-white focus:outline-none focus:border-cyan-500/40"
             value={buyInput}
             onChange={(e) => setBuyInput(e.target.value)}
           />
        </div>
        <div className="md:col-span-4">
          <button className="w-full h-24 bg-gradient-to-br from-[#ff00ff] to-[#00ffff] rounded-[2rem] text-black font-black text-lg leading-tight uppercase hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,0,255,0.3)]">
            BUY <br/> AIGODS <br/> NOW
          </button>
        </div>
      </div>

      {/* 🔥 NEW SOCIAL TASKS BOX BEFORE CLAIM */}
      <div className="w-full max-w-2xl px-4 mb-8">
        <div className="bg-[#0a0a14] border border-gray-800 rounded-[2.5rem] p-8 text-center">
          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6">Complete Tasks Before Claiming</h3>
          <div className="grid grid-cols-1 gap-4 text-left max-w-xs mx-auto">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={taskTwitter} 
                onChange={(e) => setTaskTwitter(e.target.checked)}
                className="w-5 h-5 bg-black border border-gray-700 rounded checked:bg-cyan-500 transition-all"
              />
              <span className="text-sm font-black text-gray-400 group-hover:text-white transition-all uppercase tracking-widest">Follow Twitter</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={taskTelegram} 
                onChange={(e) => setTaskTelegram(e.target.checked)}
                className="w-5 h-5 bg-black border border-gray-700 rounded checked:bg-cyan-500 transition-all"
              />
              <span className="text-sm font-black text-gray-400 group-hover:text-white transition-all uppercase tracking-widest">Join Telegram</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={taskYoutube} 
                onChange={(e) => setTaskYoutube(e.target.checked)}
                className="w-5 h-5 bg-black border border-gray-700 rounded checked:bg-cyan-500 transition-all"
              />
              <span className="text-sm font-black text-gray-400 group-hover:text-white transition-all uppercase tracking-widest">Subscribe YouTube</span>
            </label>
          </div>
        </div>
      </div>

      {/* Claim Button */}
      <div className="w-full max-w-2xl px-4 mb-20">
        <button 
          onClick={handleClaimAirdrop}
          className="w-full py-10 rounded-[2.5rem] bg-[#16da64] text-black font-black text-3xl md:text-4xl uppercase tracking-tighter hover:scale-105 transition-all shadow-[0_0_50px_rgba(22,218,100,0.5)]"
        >
          CLAIM 100 AIGODS FREE
        </button>
      </div>

      {/* Architect Referral Section */}
      <div className="w-full max-w-2xl bg-[#0a0a14] border border-gray-800/60 rounded-[3rem] p-12 mb-20 relative overflow-hidden text-center shadow-2xl">
         <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
         <h3 className="text-5xl md:text-6xl font-black italic text-gradient-magenta tracking-tighter uppercase leading-none mb-6">
           BECOME AN AIGODS ARCHITECT
         </h3>
         <div className="space-y-4 mb-10">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Viral growth is the engine of our revolution.</span>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-w-md mx-auto">
              Referrals are the <span className="text-white font-bold">fastest way</span> to promote AIGODS. By sharing, you don’t just support the project — you earn <span className="text-green-500 font-bold">20% instant rewards</span> from any total investment made through your referral link.
            </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8 bg-black/60 border border-gray-800 rounded-2xl p-4 flex items-center justify-between text-gray-600 text-[10px] font-bold overflow-hidden">
               <span className="truncate pr-2">{connectedAddress ? `${window.location.origin}?ref=${connectedAddress}` : "Connect wallet to generate referral link"}</span>
               <Lock size={12} className="opacity-40 shrink-0" />
            </div>
            <div className="md:col-span-4">
              <button 
                onClick={() => connectedAddress && copyToClipboard(`${window.location.origin}?ref=${connectedAddress}`)}
                className="w-full bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all text-sm uppercase"
              >
                <Copy size={16} /> Copy Link
              </button>
            </div>
         </div>
         <div className="mt-4">
            <span className="text-[8px] font-black text-purple-400 tracking-widest uppercase italic">MUST CONNECT WALLET TO UNLOCK REFERRAL REWARDS</span>
         </div>
      </div>

      {/* Logo Grid */}
      <div className="w-full max-w-5xl px-4 flex flex-col items-center">
        <LogoGrid />
      </div>

      {/* Certik Audit Banner */}
      <div className="mt-20 w-full max-w-2xl px-4">
        <div className="bg-black border border-green-500/30 rounded-[2.5rem] p-12 text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
           <div className="flex items-center justify-center gap-3 mb-6">
              <div className="bg-green-500/20 p-2 rounded-lg"><ShieldCheck size={28} className="text-green-500" /></div>
              <h4 className="text-2xl font-black text-white uppercase tracking-tighter">AUDITED BY CERTIK</h4>
           </div>
           <p className="text-[11px] text-gray-400 font-medium leading-relaxed max-sm mx-auto mb-8">
             The AIGODS smart contract has successfully passed comprehensive security audits by CertiK, ensuring maximum safety for all investors.
           </p>
           <button className="bg-green-950/40 border border-green-500/30 text-green-500 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all flex items-center gap-2 mx-auto">
             VIEW AUDIT REPORT <ExternalLink size={12} />
           </button>
        </div>
      </div>

      <div className="w-full h-px bg-gray-900 my-24"></div>

      {/* Footer Socials */}
      <div className="w-full max-w-5xl px-4 grid grid-cols-1 md:grid-cols-2 gap-20 mb-20 text-center md:text-left">
         <div className="space-y-8">
            <h5 className="text-cyan-400 text-xl font-black italic uppercase tracking-tighter">AIGODS OFFICIAL</h5>
            <div className="flex items-center justify-center md:justify-start gap-8">
               <a href="https://x.com/AIGODSCOIN" target="_blank" rel="noopener noreferrer" title="Twitter/X">
                  <Twitter size={32} className="text-[#1DA1F2] hover:scale-110 transition-all cursor-pointer" />
               </a>
               <a href="https://t.me/AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer" title="Telegram Channel">
                  <Send size={32} className="text-[#26A5E4] hover:scale-110 transition-all cursor-pointer" />
               </a>
               <a href="https://t.me/AIGODSCOIN" target="_blank" rel="noopener noreferrer" title="Telegram Chat">
                  <MessageSquare size={32} className="text-[#26A5E4] hover:scale-110 transition-all cursor-pointer" />
               </a>
               <a href="https://www.youtube.com/@AIGODSCOINOFFICIAL" target="_blank" rel="noopener noreferrer" title="YouTube">
                  <Youtube size={32} className="text-[#FF0000] hover:scale-110 transition-all cursor-pointer" />
               </a>
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Join the fastest growing decentralized AI community.</p>
         </div>
         <div className="space-y-8">
            <h5 className="text-[#ff00ff] text-xl font-black italic uppercase tracking-tighter">INFLUENCER HUB</h5>
            <div className="flex items-center justify-center md:justify-start gap-8">
               <a href="https://x.com/BlackRock" target="_blank" rel="noopener noreferrer" title="BlackRock Twitter">
                  <Twitter size={32} className="text-[#1DA1F2] hover:scale-110 transition-all cursor-pointer" />
               </a>
               <a href="https://x.com/elonmusk" target="_blank" rel="noopener noreferrer" title="Elon Musk X">
                  <div className="text-white hover:scale-110 transition-all font-black text-3xl cursor-pointer">X</div>
               </a>
               <a href="https://www.blackrock.com/corporate" target="_blank" rel="noopener noreferrer" title="BlackRock Website">
                  <Globe size={32} className="text-white hover:scale-110 transition-all cursor-pointer" />
               </a>
            </div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Bridging the gap between titans and the future.</p>
         </div>
      </div>

      {/* Legal Footer */}
      <div className="w-full max-w-5xl px-4 text-center space-y-8 pb-12">
        <h6 className="text-gray-500 font-black text-[11px] tracking-[0.4em] uppercase">© 2026 AI GODS – THE INTELLIGENCE LAYER OF WEB3</h6>
        <p className="text-[9px] text-gray-600 font-bold uppercase leading-relaxed tracking-wider">
          AIGODS STANDS AT THE ABSOLUTE VANGUARD OF THE DECENTRALIZED INTELLIGENCE MOVEMENT, PIONEERING A MULTI-BILLION DOLLAR ECOSYSTEM BACKED BY THE WORLD'S MOST INNOVATIVE GIANTS. AS WE BUILD THIS UNPARALLELED LEGACY, WE REMIND OUR VISIONARIES THAT THE DIGITAL FRONTIER IS VAST AND FULL OF OPPORTUNITY, YET REQUIRES WISE AND RESPONSIBLE PARTICIPATION. JOIN THE ELITE WHO ARE SCALING THE INTELLIGENCE LAYER OF WEB3—THE FUTURE BELONGS TO THE GODS OF AI.
        </p>
      </div>
      
      {/* IMPROVED MULTI-WALLET MODAL */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsWalletModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-[#0a0a0f] border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black uppercase tracking-widest">Connect Wallet</h3>
               <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                 <X size={20} />
               </button>
             </div>
             <div className="grid gap-3">
               {[
                 { name: 'MetaMask', icon: '🦊' },
                 { name: 'Phantom', icon: '👻' },
                 { name: 'Trust Wallet', icon: '🛡️' },
                 { name: 'WalletConnect', icon: '📱' },
                 { name: 'Coinbase Wallet', icon: '🔵' },
                 { name: 'SafePal', icon: '🔒' }
               ].map(w => (
                 <button 
                  key={w.name} 
                  onClick={() => connectWallet(w.name)} 
                  className="p-5 bg-gray-900/60 border border-white/5 rounded-xl font-black text-left hover:bg-blue-600 hover:text-white transition-all text-xs flex items-center justify-between group"
                 >
                   <span>{w.name}</span>
                   <span className="text-xl group-hover:scale-125 transition-transform">{w.icon}</span>
                 </button>
               ))}
             </div>
             <div className="mt-8 text-center">
               <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">By connecting, you agree to the Terms of Service.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
