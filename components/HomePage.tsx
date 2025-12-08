import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Globe, Terminal, Shield, Activity, Wifi } from 'lucide-react';
import { CyberBackground, CyberButton, GlitchText } from './CyberUI';
import { Logo } from './Logo';

interface HomePageProps {
  onStart: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const DataTerminal: React.FC<{ icon: any; title: string; desc: string; delay: number }> = ({ icon: Icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className="group relative h-full"
    >
      <div 
        className="absolute inset-0 bg-[#00ff9f]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
      />
      <div 
        className="relative h-full p-8 border border-white/10 bg-black/40 backdrop-blur-sm hover:border-[#00ff9f] transition-colors duration-300"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/20 group-hover:border-[#00ff9f] transition-colors" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 group-hover:border-[#00ff9f] transition-colors" />

        <div className="mb-6 inline-flex p-3 border border-[#ff0055]/30 bg-[#ff0055]/5 text-[#ff0055] group-hover:text-[#00ff9f] group-hover:border-[#00ff9f]/30 group-hover:bg-[#00ff9f]/5 transition-all duration-300">
          <Icon className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-mono font-bold text-white mb-4 group-hover:text-[#00ff9f] transition-colors">
          <span className="text-xs text-white/40 block mb-1">TERM_ID: {title.substring(0,3).toUpperCase()}</span>
          {title}
        </h3>
        
        <p className="text-gray-400 font-mono text-sm leading-relaxed group-hover:text-gray-300">
          {desc}
        </p>

        <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <Activity className="w-4 h-4 text-[#00ff9f] animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-[#ff0055] selection:text-white relative overflow-x-hidden">
      
      <CyberBackground />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#00ff9f]/30 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <Logo className="w-10 h-10 hover:rotate-12 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,255,159,0.5)]" />
            <span className="text-2xl font-bold font-mono tracking-tighter text-white group-hover:text-[#00ff9f] transition-colors">
              ANI<span className="text-[#00ff9f]">TRACK</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-mono text-gray-400">
               <span className="hover:text-[#00ff9f] cursor-pointer transition-colors flex items-center gap-1"><Wifi className="w-3 h-3"/> UPLINK</span>
               <span className="hover:text-[#00ff9f] cursor-pointer transition-colors flex items-center gap-1"><Terminal className="w-3 h-3"/> PROTOCOLS</span>
            </div>
            <button 
              onClick={onStart}
              className="relative px-6 py-2 bg-[#ff0055]/10 border border-[#ff0055] text-[#ff0055] font-mono text-sm font-bold uppercase tracking-wider hover:bg-[#ff0055] hover:text-white hover:shadow-[0_0_20px_#ff0055] transition-all duration-300 animate-neon-pulse-pink"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[70vh]">
          
          {/* Left: Text Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-[#00ff9f] animate-pulse" />
                <span className="font-mono text-[#00ff9f] text-sm tracking-[0.2em] uppercase">System Online v2.4</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-6" style={{ textShadow: '0 0 10px rgba(0,255,159,0.3)' }}>
                <GlitchText>JACK INTO THE</GlitchText> <br />
                <GlitchText text="ANIME MATRIX">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff9f] to-[#00baee]">ANIME MATRIX</span>
                </GlitchText>
              </h1>
              
              <p className="text-lg text-gray-400 max-w-lg font-mono leading-relaxed border-l-2 border-[#ff0055] pl-6">
                Track episodes, sync stats, and augment your memory. The ultimate interface for the digital otaku.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-wrap gap-6"
            >
              <CyberButton onClick={onStart} primary className="animate-neon-pulse-green">
                <Zap className="w-5 h-5" />
                Initialize
              </CyberButton>
              <CyberButton>
                View Demo
              </CyberButton>
            </motion.div>

            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.8 }}
               className="pt-8 flex items-center gap-4 text-xs font-mono text-gray-500"
            >
               <div className="px-3 py-1 border border-gray-800 bg-gray-900 rounded-sm">
                 STATUS: CONNECTED
               </div>
               <div className="px-3 py-1 border border-gray-800 bg-gray-900 rounded-sm flex items-center gap-2">
                 LATENCY: 12ms <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
               </div>
            </motion.div>
          </div>

          {/* Right: Holographic Interface */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative hidden lg:block perspective-[1000px]"
          >
            <motion.div
               animate={{ 
                 rotateY: [-5, 5, -5],
                 y: [-10, 10, -10]
               }}
               transition={{ 
                 rotateY: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                 y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
               }}
               className="relative transform-style-3d"
            >
              {/* Main Holo Card */}
              <div 
                className="relative w-full aspect-[4/3] bg-black/60 border border-[#00ff9f]/50 backdrop-blur-md overflow-hidden group hover:border-[#00ff9f] transition-colors duration-500"
                style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
              >
                {/* Image Background with Scanlines */}
                <div className="absolute inset-0 opacity-60 mix-blend-screen">
                  <img src="https://images.unsplash.com/photo-1613376023733-0a73315d9b06?q=80&w=1000&auto=format&fit=crop" alt="Cyber City" className="w-full h-full object-cover grayscale contrast-125" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-[#00ff9f]/20" />
                
                {/* UI Overlay */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-2 border border-[#00ff9f] bg-black/50 text-[#00ff9f] font-mono text-xs">
                       REC: 00:23:45
                    </div>
                    <Activity className="w-6 h-6 text-[#ff0055] animate-pulse" />
                  </div>
                  
                  <div className="space-y-2">
                     <div className="text-[#00ff9f] font-mono text-xs tracking-widest">TARGET_ACQUIRED</div>
                     <h2 className="text-3xl font-black text-white glitch-text uppercase">
                        Cyberpunk<br/>Edgerunners
                     </h2>
                     <div className="h-1 w-full bg-gray-800 mt-2 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "80%" }}
                          transition={{ duration: 2, delay: 1 }}
                          className="h-full bg-[#ff0055]" 
                        />
                     </div>
                     <div className="flex justify-between font-mono text-xs text-gray-300 mt-1">
                        <span>SYNCING...</span>
                        <span>80%</span>
                     </div>
                  </div>
                </div>

                {/* Glitch Overlay on Hover */}
                <div className="absolute inset-0 bg-[#00ff9f] mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>

              {/* Floating Elements behind */}
              <div className="absolute -top-10 -right-10 w-40 h-40 border border-[#ff0055]/30 rounded-full border-dashed animate-spin-slow -z-10" />
              <div className="absolute -bottom-5 -left-5 w-full h-full border border-[#00ff9f]/20 -z-10" style={{ transform: 'translateZ(-20px)' }} />

            </motion.div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="mt-32">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="flex items-end gap-4 mb-12 border-b border-gray-800 pb-4"
          >
             <h2 className="text-3xl font-bold text-white">SYSTEM_MODULES</h2>
             <span className="font-mono text-[#ff0055] text-sm pb-1 animate-pulse">/// ACCESS GRANTED</span>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 h-full">
             <DataTerminal 
               delay={0}
               icon={Globe}
               title="JIKAN_UPLINK"
               desc="Direct neural link to the Jikan API. Retrieve metadata, cover art, and synopsis data with zero latency."
             />
             <DataTerminal 
               delay={0.2}
               icon={Cpu}
               title="CHRONO_SYNC"
               desc="Advanced algorithms calculate your total immersion time in the network. Track minutes, hours, and lifetime stats."
             />
             <DataTerminal 
               delay={0.4}
               icon={Shield}
               title="SECURE_VAULT"
               desc="Firebase encrypted cloud storage ensures your watchlist data persists across all your devices and realities."
             />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#00ff9f]/20 bg-black/90 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 font-mono text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-[#00ff9f] rounded-full" />
             <span>SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <div>
            © 2024 NÉOTRACK // ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>
    </div>
  );
};