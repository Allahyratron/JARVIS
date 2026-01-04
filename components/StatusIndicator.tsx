
import React from 'react';
import { ConnectionStatus } from '../types';

const StatusIndicator: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return { label: 'Online', color: 'bg-cyan-500', glow: 'shadow-[0_0_10px_rgba(34,211,238,0.5)]' };
      case ConnectionStatus.CONNECTING:
        return { label: 'Syncing', color: 'bg-yellow-500', glow: 'animate-pulse' };
      case ConnectionStatus.ERROR:
        return { label: 'System Failure', color: 'bg-red-500', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]' };
      default:
        return { label: 'Offline', color: 'bg-slate-700', glow: '' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="glass-panel px-3 py-1 rounded-sm flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${config.color} ${config.glow}`} />
      <span className="text-[10px] uppercase font-bold tracking-widest">{config.label}</span>
    </div>
  );
};

export default StatusIndicator;
