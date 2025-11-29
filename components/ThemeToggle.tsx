import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm backdrop-blur-sm border border-sakura-200 dark:border-slate-700 group"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
      ) : (
        <Sun className="w-5 h-5 text-sakura-500 group-hover:text-sakura-600 transition-colors" />
      )}
    </button>
  );
};