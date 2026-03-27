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
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-between py-10 md:py-20 opacity-60">
        {/* Top Logo */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0.4 }}
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: [0.4, 0.8, 0.4],
            y: [0, -20, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-full max-w-[300px] md:max-w-[600px] px-4"
        >
          <img 
            src={BG_LOGO_TOP} 
            alt="Background Top" 
            className="w-full h-auto drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            onError={handleImageError}
          />
        </motion.div>

        {/* Center Logo */}
        <motion.div 
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.9, 0.5],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 12, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-full max-w-[400px] md:max-w-[800px] px-4"
        >
          <img 
            src={BG_LOGO_CENTER} 
            alt="Background Center" 
            className="w-full h-auto drop-shadow-[0_0_50px_rgba(34,211,238,0.8)]"
            onError={handleImageError}
          />
        </motion.div>

        {/* Bottom Logo */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0.4 }}
          animate={{ 
            scale: [0.9, 1.1, 0.9],
            opacity: [0.4, 0.8, 0.4],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-full max-w-[300px] md:max-w-[600px] px-4"
        >
          <img 
            src={BG_LOGO_BOTTOM} 
            alt="Background Bottom" 
            className="w-full h-auto drop-shadow-[0_0_30px_rgba(34,211,238,0.6)]"
            onError={handleImageError}
          />
        </motion.div>
      </div>

      {/* Subtle overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-[1]"></div>

      <div 
        className="absolute inset-0 bg-center bg-no-repeat opacity-20 z-10"
        style={{ 
          backgroundImage: `url('${AIGODS_LOGO_URL}')`,
          backgroundSize: 'contain',
          filter: 'brightness(0.4) contrast(1.2)',
        }}
      />

      <div className="absolute inset-0 overflow-hidden [perspective:1500px] z-10">
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
