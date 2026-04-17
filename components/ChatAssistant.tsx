import React, { useState } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Sparkles,
  Mail,
  Twitter,
  Trophy,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Zap,
  Info,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';

interface ChatAssistantProps {
  logoUrl: string;
  onOpenRewards: () => void;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ logoUrl, onOpenRewards }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = "https://ui-avatars.com/api/?name=AIGODS&background=0D0D0D&color=00ffff&size=256&bold=true";
  };

  const scrollToRewards = () => {
    onOpenRewards();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[150] flex flex-col items-end">
      {!isOpen && (
        <button onClick={() => {setIsOpen(true); setIsMinimized(false);}} className="relative w-20 h-20 md:w-32 md:h-32 group hover:scale-110 transition-all cursor-pointer">
          <div className="absolute inset-0 bg-cyan-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-full h-full rounded-full border-4 border-cyan-400 bg-[#0a0a0f] flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.4)]">
            <img 
              src={logoUrl} 
              alt="AI Assistant" 
              className="w-full h-full object-cover group-hover:rotate-12 transition-transform duration-500" 
              onError={handleImageError}
            />
          </div>
          <div className="absolute -top-1 -right-1 bg-cyan-400 w-6 h-6 rounded-full flex items-center justify-center border-2 border-black animate-bounce shadow-lg">
            <Sparkles size={12} className="text-black" />
          </div>
        </button>
      )}

      {isOpen && (
        <div className={`flex flex-col bg-[#050508]/95 backdrop-blur-2xl border border-gray-800 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden transition-all duration-500 ${isFullScreen ? 'fixed inset-4' : isMinimized ? 'h-20 w-80' : 'w-[90vw] md:w-[480px] h-[75vh] md:h-[80vh] max-h-[700px] border-cyan-500/20'}`}>
          <div className="p-4 md:p-6 bg-gradient-to-r from-gray-900/80 to-transparent border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden bg-black">
                <img 
                  src={logoUrl} 
                  className="w-full h-full object-cover" 
                  onError={handleImageError}
                />
              </div>
              <div className="flex flex-col">
                <h4 className="text-white font-[1000] text-sm uppercase tracking-widest flex items-center gap-2 italic">AIGODS AI <Sparkles size={12} className="text-cyan-400" /></h4>
                <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest">Intelligent Ecosystem</span>
              </div>
            </div>
            <div className="flex gap-2 text-white/60 items-center">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <Minimize2 size={18} />
              </button>
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <Maximize2 size={18} />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all ml-2"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-hide bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.05),transparent)]">
              {/* Upgrade Notice */}
              <div className="bg-cyan-500/5 border-2 border-cyan-500/20 rounded-[2rem] p-8 text-center space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cyan-500/20 group-hover:rotate-12 transition-transform duration-500">
                  <Zap size={32} className="text-cyan-400" />
                </div>
                <h5 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter italic">🤖 Welcome to AIGODS AI</h5>
                <p className="text-gray-400 text-xs md:text-[13px] leading-relaxed font-medium">
                  Our AI assistant is currently being upgraded and will be available soon.
                </p>
                <p className="text-cyan-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-relaxed">
                  🚀 AIGODS is building a powerful future combining AI and blockchain technology to create real earning opportunities for everyone.
                </p>
              </div>

              {/* Start Earning Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-gray-800"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">OPPORTUNITIES</span>
                  <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-gray-800"></div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: <Zap size={16}/>, text: "Buying AIGODS Coin", color: "text-cyan-400" },
                    { icon: <Sparkles size={16}/>, text: "Claiming available airdrops", color: "text-purple-400" },
                    { icon: <MessageCircle size={16}/>, text: "Participating in our referral program", color: "text-green-400" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                      <div className={`${item.color} bg-black/40 p-2 rounded-xl border border-current/20`}>{item.icon}</div>
                      <span className="text-white font-black text-[11px] md:text-xs uppercase tracking-wider">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div 
                  onClick={scrollToRewards}
                  className="bg-gradient-to-r from-yellow-500/10 to-transparent border-l-4 border-yellow-500 p-6 rounded-r-2xl cursor-pointer hover:bg-yellow-500/20 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h6 className="text-yellow-400 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                      <Trophy size={14} /> REWARDS PROGRAM
                    </h6>
                    <ExternalLink size={12} className="text-yellow-400/50 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-gray-400 text-[10px] leading-relaxed font-bold uppercase tracking-tight">
                    Rewards are available for top referrers! Check the reward section to see how you can qualify and win.
                  </p>
                </div>
              </div>

              {/* Social CTA */}
              <div className="bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 rounded-[2rem] p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <Twitter size={24} />
                </div>
                <h5 className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter italic">🐦 Stay Connected</h5>
                <p className="text-gray-400 text-[10px] md:text-xs font-black uppercase tracking-widest leading-relaxed">
                  Follow us on X (Twitter) for updates, announcements, and community engagement.
                </p>
                <a 
                  href="https://x.com/AIGODSCOIN" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-3 text-white font-black text-lg md:text-xl underline decoration-blue-500 decoration-4 underline-offset-8 hover:text-blue-400 transition-all"
                >
                  @AIGODSCOIN <ExternalLink size={16} />
                </a>
                <p className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">The earlier you engage, the bigger your advantage.</p>
              </div>

              {/* Referral CTA Button */}
              <button 
                onClick={scrollToRewards}
                className="w-full py-8 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-[1000] text-xl md:text-2xl uppercase tracking-tighter rounded-[2rem] shadow-[0_20px_40px_rgba(234,179,8,0.2)] hover:scale-[1.03] active:scale-[0.97] transition-all group flex flex-col items-center justify-center leading-none"
              >
                <span className="flex items-center gap-3"><Rocket size={24} className="group-hover:translate-y-[-4px] group-hover:translate-x-[4px] transition-transform duration-500" /> EARN WITH AIGODS</span>
                <span className="text-[10px] opacity-60 tracking-[0.3em] mt-2">CLICK TO VIEW REWARDS</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
