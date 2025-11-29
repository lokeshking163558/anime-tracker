import React from 'react';
import { Clock, Calendar, TrendingUp, Award } from 'lucide-react';
import { formatMinutes } from '../services/statsService';
import { UserStats } from '../types';

interface StatsBoardProps {
  stats: UserStats;
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ stats }) => {
  const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass: string }) => (
    <div className="glass-panel p-4 rounded-xl border border-white/40 dark:border-slate-700 shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${colorClass} bg-opacity-20 backdrop-blur-md`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-').replace('/20', '')}`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Today" 
        value={formatMinutes(stats.todayMinutes)} 
        icon={Clock} 
        colorClass="bg-blue-500/20 text-blue-600 dark:text-blue-400" 
      />
      <StatCard 
        title="This Month" 
        value={formatMinutes(stats.monthMinutes)} 
        icon={Calendar} 
        colorClass="bg-pink-500/20 text-pink-600 dark:text-pink-400" 
      />
      <StatCard 
        title="This Year" 
        value={formatMinutes(stats.yearMinutes)} 
        icon={TrendingUp} 
        colorClass="bg-purple-500/20 text-purple-600 dark:text-purple-400" 
      />
      <StatCard 
        title="Lifetime" 
        value={formatMinutes(stats.lifetimeMinutes)} 
        icon={Award} 
        colorClass="bg-amber-500/20 text-amber-600 dark:text-amber-400" 
      />
    </div>
  );
};