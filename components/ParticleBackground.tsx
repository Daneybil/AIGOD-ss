
import React from 'react';
import { AIGODS_LOGO_URL } from '../constants';

const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-black">
      {/* Main Large Background Image - Darkened and Slowly Zooming */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom opacity-20"
        style={{ 
          backgroundImage: `url('${AIGODS_LOGO_URL}')`,
          filter: 'brightness(0.5) contrast(1.1) saturate(0.8)'
        }}
      />
      {/* Darkened Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/95 mix-blend-multiply" />
      <div className="absolute inset-0 animate-pulse-slow bg-cyan-500/5" />

      {/* Floating AIGODS Logos Animation */}
      <div className="absolute inset-0 overflow-hidden [perspective:1500px] z-10">
        {[...Array(18)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * -40}s`,
              animationDuration: `${20 + Math.random() * 25}s`,
            }}
          >
            <div 
              className="relative w-12 h-12 md:w-20 md:h-20 [transform-style:preserve-3d] animate-coin-rotate-y"
              style={{ 
                animationDuration: `${5 + Math.random() * 8}s`, 
                opacity: 0.2 + Math.random() * 0.3 
              }}
            >
              {/* Floating Logo Particle */}
              <div className="absolute inset-0 rounded-full overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
                <img 
                  src={AIGODS_LOGO_URL} 
                  alt="Gods Logo" 
                  className="w-full h-full object-cover grayscale brightness-75" 
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
