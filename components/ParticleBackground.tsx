import React from 'react';
import { AIGODS_LOGO_URL } from '../constants.ts';

const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-[#0b0b0f]">
      <div 
        className="absolute inset-0 bg-center bg-no-repeat opacity-30"
        style={{ 
          backgroundImage: `url('${AIGODS_LOGO_URL}')`,
          backgroundSize: 'contain',
          filter: 'brightness(0.4) contrast(1.2)'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0f]/90 via-[#0b0b0f]/80 to-[#0b0b0f]/95" />
      <div className="absolute inset-0 animate-pulse-slow bg-cyan-500/5 mix-blend-screen" />

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