
import React, { useEffect, useRef } from 'react';
import { TranscriptionLine } from '../types';

interface HUDPanelProps {
  transcriptions: TranscriptionLine[];
}

const HUDPanel: React.FC<HUDPanelProps> = ({ transcriptions }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  return (
    <div className="glass-panel flex-1 rounded-sm p-4 flex flex-col overflow-hidden relative">
      <div className="text-[10px] mb-3 border-b border-cyan-500/20 pb-1 flex justify-between items-center opacity-60">
        <span>&gt; INTERFACE_LOG</span>
        <span className="animate-pulse">REC</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {transcriptions.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-30 text-xs italic">
            Waiting for input...
          </div>
        )}
        {transcriptions.map((line) => (
          <div key={line.id} className={`flex flex-col ${line.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[8px] opacity-40 mb-1">
              [{new Date(line.timestamp).toLocaleTimeString()}] {line.role === 'user' ? 'USER' : 'JARVIS'}
            </span>
            <div className={`text-xs p-2 rounded-sm max-w-[90%] leading-relaxed ${
              line.role === 'user' 
                ? 'bg-cyan-500/10 border-r-2 border-cyan-400/50 text-right' 
                : 'bg-white/5 border-l-2 border-white/20'
            }`}>
              {line.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="absolute inset-0 pointer-events-none border border-cyan-400/10 animate-pulse" />
    </div>
  );
};

export default HUDPanel;
