import React from 'react';
import { motion } from 'motion/react';
import { AIGODS_LOGO_URL, BG_LOGO_TOP, BG_LOGO_CENTER, BG_LOGO_BOTTOM } from '../constants.ts';

const ParticleBackground: React.FC = () => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = "https://ui-avatars.com/api/?name=AIGODS&background=0D0D0D&color=00ffff&size=128&bold=true";
  };

  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-[#0b0b0f]">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0f]/70 via-[#0b0b0f]/60 to-[#0b0b0f]/80" />
      <div className="absolute inset-0 animate-pulse-slow bg-cyan-500/5 mix-blend-screen" />

      {/* Animated Background Logos - Permanent Billboard */}
      <div className="absolute inset-0 z-[-10] flex items-center justify-center pointer-events-none opacity-60">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Main Centered Logo with slow, complex motion - HUGE BILLBOARD */}
          <motion.div 
            initial={{ scale: 1.2, opacity: 0.4 }}
            animate={{ 
              scale: [1.2, 1.4, 1.2],
              opacity: [0.4, 0.7, 0.4],
              rotate: [0, 5, -5, 0],
              x: [0, 50, -50, 0],
              y: [0, -30, 30, 0]
            }}
            transition={{ 
              duration: 50, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="w-full max-w-[800px] md:max-w-[1400px] px-4"
          >
            <img 
              src={BG_LOGO_CENTER} 
              alt="Background Center" 
              className="w-full h-auto filter brightness-75 contrast-150 drop-shadow-[0_0_150px_rgba(34,211,238,0.4)]"
              onError={handleImageError}
            />
          </motion.div>

          {/* Secondary Subtle Logos for depth - Also Huge */}
          <motion.div 
            animate={{ 
              y: [0, -60, 0],
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 md:top-10 w-full max-w-[500px] md:max-w-[1000px] px-4 opacity-30"
          >
            <img src={BG_LOGO_TOP} alt="Background Top" className="w-full h-auto filter brightness-60 contrast-125" onError={handleImageError} />
          </motion.div>

          <motion.div 
            animate={{ 
              y: [0, 60, 0],
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 md:bottom-10 w-full max-w-[500px] md:max-w-[1000px] px-4 opacity-30"
          >
            <img src={BG_LOGO_BOTTOM} alt="Background Bottom" className="w-full h-auto filter brightness-60 contrast-125" onError={handleImageError} />
          </motion.div>
        </div>
      </div>

      {/* Subtle overlay for readability - Adjusted for better visibility of logos */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-[-5]"></div>

      <div 
        className="absolute inset-0 bg-center bg-no-repeat opacity-15 z-[-8]"
        style={{ 
          backgroundImage: `url('${AIGODS_LOGO_URL}')`,
          backgroundSize: 'contain',
          filter: 'brightness(0.4) contrast(1.2)',
        }}
      />

      <div className="absolute inset-0 overflow-hidden [perspective:1500px] z-[-15]">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * -40}s`,
              animationDuration: `${25 + Math.random() * 30}s`,
            }}
          >
            <div 
              className="relative w-10 h-10 md:w-16 md:h-16 [transform-style:preserve-3d] animate-coin-rotate-y"
              style={{ 
                animationDuration: `${8 + Math.random() * 12}s`, 
                opacity: 0.1 + Math.random() * 0.15 
              }}
            >
              <div className="absolute inset-0 rounded-full overflow-hidden border border-white/5 bg-black/20 backdrop-blur-[2px]">
                <img 
                  src={AIGODS_LOGO_URL} 
                  alt="Gods Logo" 
                  className="w-full h-full object-cover grayscale brightness-50"
                  onError={handleImageError}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticleBackground;
