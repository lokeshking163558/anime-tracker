import React from 'react';
import { Clock, Calendar, TrendingUp, Award } from 'lucide-react';
import { formatMinutes } from '../services/statsService';
import { UserStats } from '../types';
import { CyberCard } from './CyberUI';

interface StatsBoardProps {
  stats: UserStats;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  const StatCard = ({ title, value, icon: Icon, colorClass, iconColor }: { title: string, value: string, icon: any, colorClass: string, iconColor: string }) => (
    <div 
      className="relative p-4 bg-black/60 border border-white/10 group hover:border-[#00ff9f]/50 transition-colors duration-300"
      style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 group-hover:border-[#00ff9f] transition-colors" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 group-hover:border-[#00ff9f] transition-colors" />

      <div className="flex items-center space-x-4 relative z-10">
        <div className={`p-3 bg-black border border-white/10 shadow-[0_0_10px_rgba(0,0,0,0.5)]`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{title}</p>
          <p className={`text-xl font-bold font-mono ${colorClass} drop-shadow-md`}>{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Today's Log" 
        value={formatMinutes(stats.todayMinutes)} 
        icon={Clock} 
        colorClass="text-cyber-blue"
        iconColor="text-cyber-blue" 
      />
      <StatCard 
        title="Monthly Cycle" 
        value={formatMinutes(stats.monthMinutes)} 
        icon={Calendar} 
        colorClass="text-cyber-pink" 
        iconColor="text-cyber-pink"
      />
      <StatCard 
        title="Yearly Data" 
        value={formatMinutes(stats.yearMinutes)} 
        icon={TrendingUp} 
        colorClass="text-cyber-purple" 
        iconColor="text-cyber-purple"
      />
      <StatCard 
        title="Total Immersion" 
        value={formatMinutes(stats.lifetimeMinutes)} 
        icon={Award} 
        colorClass="text-cyber-green" 
        iconColor="text-cyber-green"
      />
    </div>
  );
};