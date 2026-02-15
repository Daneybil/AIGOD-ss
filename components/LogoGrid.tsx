
import React from 'react';
import { LOGO_DATA } from '../constants.ts';

const LogoGrid: React.FC = () => {
  return (
    <div className="mt-20 w-full max-w-5xl px-4">
      <h2 className="text-[10px] font-black text-center mb-12 text-cyan-400 tracking-[0.4em] uppercase">Backed by Titans & Innovators</h2>
      <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-5 gap-y-12 gap-x-4 items-center justify-items-center">
        {LOGO_DATA.map((logo, i) => (
          <div 
            key={i} 
            className={`flex items-center justify-center w-full h-8 transition-all duration-300 transform hover:scale-110 cursor-pointer opacity-60 hover:opacity-100`}
          >
            <img 
              src={logo.url} 
              alt={logo.name} 
              className={`max-h-full max-w-full object-contain ${
                ['Apple', 'X', 'OpenAI', 'BL', 'Meta', 'Microsoft', 'CO', 'Ethereum', 'Solana', 'Polygon', 'Phantom'].includes(logo.name) 
                  ? 'filter invert brightness-200' 
                  : ''
              }`}
              style={{ display: 'block', visibility: 'visible', opacity: 1 }}
              onError={(e) => {
                 (e.target as HTMLImageElement).onerror = null;
                 (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${logo.name}&background=0D0D0D&color=fff&size=64&font-size=0.4&bold=true`;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoGrid;
