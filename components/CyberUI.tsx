
import React from 'react';
import { motion } from 'framer-motion';

// --- Background Components ---

export const CyberBackground: React.FC = () => {
  const bgGrid = `
    radial-gradient(circle, var(--accent-color) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.9) 100%)
  `;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 bg-[var(--bg-color)] transition-colors duration-500" />
      
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1))',
          backgroundSize: '100% 4px'
        }}
      />
      
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Grid */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none transition-opacity duration-500"
        style={{
          backgroundImage: bgGrid,
          backgroundSize: '40px 40px, 100% 100%'
        }}
      />
    </>
  );
};

// --- Text Components ---

export const GlitchText: React.FC<{ children: React.ReactNode; text?: string; className?: string }> = ({ children, text, className = "" }) => {
  const content = text || (typeof children === 'string' ? children : '');

  return (
    <div className={`relative inline-block group ${className}`}>
      <span className="relative z-10">{children}</span>
      <motion.span 
        className="absolute top-0 left-0 -z-10 w-full h-full text-cyber-pink opacity-0 group-hover:opacity-100 select-none pointer-events-none mix-blend-screen"
        initial={{ x: 0, y: 0 }}
        whileHover={{
          x: [-2, 2, -1, 3, 0],
          y: [1, -1, 0, 1, 0],
          opacity: [0, 0.8, 0, 0.5, 0],
          transition: { duration: 0.3, repeat: Infinity, repeatType: "mirror", repeatDelay: 0.1 }
        }}
      >
        {content}
      </motion.span>
      <motion.span 
        className="absolute top-0 left-0 -z-10 w-full h-full text-accent opacity-0 group-hover:opacity-100 select-none pointer-events-none mix-blend-screen"
        initial={{ x: 0, y: 0 }}
        whileHover={{
          x: [2, -2, 1, -3, 0],
          y: [-1, 2, 0, -1, 0],
          opacity: [0, 0.8, 0, 0.5, 0],
          transition: { duration: 0.4, repeat: Infinity, repeatType: "mirror", repeatDelay: 0.05 }
        }}
      >
        {content}
      </motion.span>
    </div>
  );
};

// --- Interaction Components ---

export const CyberButton: React.FC<{ 
  children: React.ReactNode; 
  onClick?: () => void; 
  type?: "button" | "submit" | "reset";
  primary?: boolean; 
  className?: string;
  disabled?: boolean;
}> = ({ 
  children, 
  onClick, 
  type = "button",
  primary = false,
  className = "",
  disabled = false
}) => {
  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative px-6 py-3 font-mono font-bold tracking-widest uppercase transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)'
      }}
    >
      <div className={`absolute inset-0 border-2 transition-all duration-300 ${
        primary 
          ? 'bg-accent/10 border-accent group-hover:bg-accent group-hover:shadow-[0_0_30px_var(--accent-color)]' 
          : 'bg-transparent border-[var(--text-color)] opacity-30 group-hover:opacity-100 group-hover:bg-[var(--text-color)] group-hover:border-[var(--text-color)]'
      }`} />
      
      <span className={`relative z-10 flex items-center justify-center gap-2 ${
        primary 
          ? 'text-accent group-hover:text-black' 
          : 'text-[var(--text-color)] group-hover:invert transition-all'
      }`}>
        {children}
      </span>
    </motion.button>
  );
};

export const CyberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className, ...props }) => {
  return (
    <div className="relative group">
      <label className="block text-xs font-mono text-accent mb-1 uppercase tracking-wider opacity-80 group-focus-within:opacity-100 group-focus-within:text-shadow-accent">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full bg-[var(--input-bg)] border border-gray-700/50 text-[var(--text-color)] px-4 py-3 font-mono text-sm focus:outline-none focus:border-accent focus:bg-accent/5 transition-all duration-300 ${className}`}
          style={{
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
          }}
        />
        {/* Corner Accent */}
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-accent opacity-50 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
};

// --- Layout Components ---

export const CyberCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <div 
      className={`relative bg-[var(--card-bg)] backdrop-blur-md border border-[var(--border-color)] p-1 transition-colors duration-500 ${className}`}
      style={{
        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full border border-accent/20 pointer-events-none" 
         style={{ clipPath: 'inherit' }} 
      />
      {/* Decorative bits */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/50" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/50" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
