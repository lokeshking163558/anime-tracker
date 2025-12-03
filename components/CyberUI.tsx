import React from 'react';
import { motion } from 'framer-motion';

// --- Background Components ---

export const CyberBackground: React.FC = () => {
  const bgGrid = `
    radial-gradient(circle, #00ff9f 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.9) 100%)
  `;

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 bg-black" />
      
      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2))',
          backgroundSize: '100% 4px'
        }}
      />
      
      {/* Vignette */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />

      {/* Grid */}
      <div 
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
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
        className="absolute top-0 left-0 -z-10 w-full h-full text-[#ff0055] opacity-0 group-hover:opacity-100 select-none pointer-events-none mix-blend-screen"
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
        className="absolute top-0 left-0 -z-10 w-full h-full text-[#00ff9f] opacity-0 group-hover:opacity-100 select-none pointer-events-none mix-blend-screen"
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
          ? 'bg-[#00ff9f]/10 border-[#00ff9f] group-hover:bg-[#00ff9f] group-hover:shadow-[0_0_30px_#00ff9f]' 
          : 'bg-transparent border-[#ff0055] group-hover:bg-[#ff0055]/20 group-hover:shadow-[0_0_30px_#ff0055]'
      }`} />
      
      <span className={`relative z-10 flex items-center justify-center gap-2 ${
        primary 
          ? 'text-[#00ff9f] group-hover:text-black' 
          : 'text-[#ff0055] group-hover:text-white'
      }`}>
        {children}
      </span>
    </motion.button>
  );
};

export const CyberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className, ...props }) => {
  return (
    <div className="relative group">
      <label className="block text-xs font-mono text-[#00ff9f] mb-1 uppercase tracking-wider opacity-80 group-focus-within:opacity-100 group-focus-within:text-shadow-[0_0_5px_#00ff9f]">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          className={`w-full bg-black/50 border border-gray-700 text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-[#00ff9f] focus:bg-[#00ff9f]/5 transition-all duration-300 ${className}`}
          style={{
            clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)'
          }}
        />
        {/* Corner Accent */}
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#00ff9f] opacity-50 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </div>
  );
};

// --- Layout Components ---

export const CyberCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
  return (
    <div 
      className={`relative bg-black/80 backdrop-blur-md border border-white/10 p-1 ${className}`}
      style={{
        clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
      }}
    >
      <div className="absolute top-0 left-0 w-full h-full border border-[#00ff9f]/20 pointer-events-none" 
         style={{ clipPath: 'inherit' }} 
      />
      {/* Decorative bits */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00ff9f]/50" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00ff9f]/50" />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};