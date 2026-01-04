
import React from 'react';
import { SystemStats } from '../types';
import { BarChart, Bar, ResponsiveContainer, YAxis, Cell } from 'recharts';

interface SystemMonitorProps {
  stats: SystemStats;
}

const SystemMonitor: React.FC<SystemMonitorProps> = ({ stats }) => {
  const chartData = [
    { name: 'CPU', value: stats.cpu },
    { name: 'MEM', value: stats.memory },
    { name: 'PWR', value: stats.power },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Circular Stats */}
      <div className="glass-panel p-4 rounded-sm">
        <div className="text-[10px] opacity-50 mb-3 tracking-tighter">&gt; CORE_DIAGNOSTICS</div>
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs opacity-60">Latency</div>
            <div className="text-xl font-bold">{stats.latency.toFixed(1)}ms</div>
          </div>
          <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar dataKey="value">
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 2 ? '#fbbf24' : '#22d3ee'} fillOpacity={0.6} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="glass-panel p-4 rounded-sm flex flex-col gap-3">
        <StatBar label="Neural Synapse" value={stats.cpu} />
        <StatBar label="Memory Buffer" value={stats.memory} />
        <StatBar label="Power Grid" value={stats.power} color="rgb(251, 191, 36)" />
      </div>

      <div className="text-[9px] opacity-30 leading-tight tracking-widest uppercase">
        Encrypted Layer // 256-Bit<br/>
        Sovereign Protocol // Enabled<br/>
        Neural Link // Synced
      </div>
    </div>
  );
};

const StatBar = ({ label, value, color = 'rgb(34, 211, 238)' }: { label: string, value: number, color?: string }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-[10px] opacity-70 uppercase tracking-tighter">
      <span>{label}</span>
      <span>{value.toFixed(0)}%</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-500 ease-out" 
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} 
      />
    </div>
  </div>
);

export default SystemMonitor;
