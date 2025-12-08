import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Activity, Waves } from 'lucide-react';

export const AmbientSound: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize the Web Audio API Synth
  const initAudio = () => {
    if (audioCtxRef.current) {
        // If context exists but is suspended, resume it
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
            setIsPlaying(true);
        }
        return;
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    // Master Gain (Volume Control)
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.05; // Keep it very subtle (5% volume)
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // --- OSCILLATOR 1: Low Drone (Sawtooth for texture) ---
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; // Low A (A1)

    // --- OSCILLATOR 2: Harmonics (Sine for warmth) ---
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 110; // A2

    // --- FILTER: Lowpass to make it ambient/muffled ---
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300; // Start muffled
    filter.Q.value = 1;

    // --- LFO: Modulate the filter to make it "breathe" ---
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // Very slow cycle (~7 seconds)
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 150; // Modulate cutoff by +/- 150Hz

    // Routing: LFO -> Filter Frequency
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    // Routing: Oscillators -> Filter -> Master Gain
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);

    // Start Generators
    osc1.start();
    osc2.start();
    lfo.start();

    setIsPlaying(true);
  };

  const toggleSound = () => {
    if (!audioCtxRef.current) {
      initAudio();
    } else {
      if (audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
        setIsPlaying(false);
      } else {
        audioCtxRef.current.resume();
        setIsPlaying(true);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (audioCtxRef.current) {
            audioCtxRef.current.close();
        }
    };
  }, []);

  return (
    <button
      onClick={toggleSound}
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-2 border backdrop-blur-md transition-all duration-300 font-mono text-xs uppercase tracking-widest group ${
        isPlaying 
          ? 'bg-[#00ff9f]/10 border-[#00ff9f] text-[#00ff9f] shadow-[0_0_20px_rgba(0,255,159,0.3)]' 
          : 'bg-black/80 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
      }`}
      style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
      title={isPlaying ? "Mute Ambient Synth" : "Engage Ambient Synth"}
    >
      {isPlaying ? (
        <>
          <Waves className="w-4 h-4 animate-pulse" />
          <span className="hidden sm:inline">AMBIENCE: ON</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">AMBIENCE: OFF</span>
        </>
      )}
    </button>
  );
};
