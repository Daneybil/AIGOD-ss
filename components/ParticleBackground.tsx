
import React from 'react';
import { AIGODS_LOGO_URL } from '../constants';

const ParticleBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none bg-black">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-zoom opacity-40"
        style={{ 
          backgroundImage: `url('${AIGODS_LOGO_URL}')`,
          filter: 'brightness(0.7) contrast(1.3) saturate(1.2)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/60 via-black/80 to-black/95 mix-blend-multiply" />
      <div className="absolute inset-0 animate-pulse-slow bg-orange-500/5" />

      <div className="absolute inset-0 overflow-hidden [perspective:1500px] z-10">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * -40}s`,
              animationDuration: `${18 + Math.random() * 22}s`,
            }}
          >
            <div 
              className="relative w-12 h-12 md:w-20 md:h-20 [transform-style:preserve-3d] animate-spin-3d"
              style={{ animationDuration: `${4 + Math.random() * 7}s`, opacity: 0.3 + Math.random() * 0.3 }}
            >
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="absolute inset-0 rounded-full border border-yellow-800 bg-yellow-600" style={{ transform: `translateZ(${idx - 2}px)` }} />
              ))}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-600 to-yellow-300 border-2 border-yellow-200 flex items-center justify-center text-yellow-900 font-black text-2xl md:text-3xl [transform:translateZ(3px)]">₿</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParticleBackground;
