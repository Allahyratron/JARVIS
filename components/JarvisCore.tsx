
import React from 'react';
import { ConnectionStatus } from '../types';

interface JarvisCoreProps {
  active: boolean;
  status: ConnectionStatus;
}

const JarvisCore: React.FC<JarvisCoreProps> = ({ active, status }) => {
  const isError = status === ConnectionStatus.ERROR;
  const isConnecting = status === ConnectionStatus.CONNECTING;
  
  const baseColor = isError ? 'rgb(239, 68, 68)' : 'rgb(34, 211, 238)';
  const shadowColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 211, 238, 0.4)';

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Rotating Rings */}
      <div className={`absolute inset-0 border-[1px] border-dashed border-cyan-500/20 rounded-full ${active ? 'animate-[spin_10s_linear_infinite]' : ''}`} />
      <div className={`absolute inset-4 border-[1px] border-cyan-500/30 rounded-full ${active ? 'animate-[spin_15s_linear_infinite_reverse]' : ''}`}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full blur-[2px]" />
      </div>
      
      {/* Hexagon Pattern Overlay (Decorative) */}
      <div className="absolute inset-8 opacity-10 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-cyan-500 stroke-[0.5]">
          <path d="M50 5 L90 27 L90 72 L50 95 L10 72 L10 27 Z" />
          <path d="M50 15 L82 33 L82 66 L50 85 L18 66 L18 33 Z" />
        </svg>
      </div>

      {/* Central Orb */}
      <div className="relative w-32 h-32">
        {/* Pulsing Aura */}
        <div 
          className="pulse-ring absolute inset-0 rounded-full" 
          style={{ 
            boxShadow: `inset 0 0 40px ${shadowColor}, 0 0 20px ${shadowColor}`,
            border: `1px solid ${baseColor}33`
          }} 
        />
        
        {/* The Core */}
        <div 
          className={`absolute inset-4 rounded-full flex items-center justify-center transition-all duration-500 ${isConnecting ? 'animate-pulse' : ''}`}
          style={{ 
            background: `radial-gradient(circle, ${baseColor} 0%, transparent 80%)`,
            boxShadow: `0 0 30px ${shadowColor}`
          }}
        >
          {/* Internal Geometric Core */}
          <div className="w-16 h-16 opacity-80">
            <svg viewBox="0 0 100 100" className={`w-full h-full stroke-[2] ${active ? 'animate-[spin_4s_linear_infinite]' : ''}`} style={{ stroke: baseColor }}>
               <polygon points="50,10 90,90 10,90" fill="none" />
               <polygon points="50,90 90,10 10,10" fill="none" />
               <circle cx="50" cy="50" r="15" fill={baseColor} className="opacity-40" />
            </svg>
          </div>
        </div>
      </div>

      {/* Visual Feedback Bars (Bottom) */}
      {active && (
        <div className="absolute -bottom-16 flex gap-1 items-end h-8">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="w-1 bg-cyan-400/60 rounded-full animate-bounce"
              style={{ 
                height: `${20 + Math.random() * 80}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.4 + Math.random() * 0.4}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JarvisCore;
