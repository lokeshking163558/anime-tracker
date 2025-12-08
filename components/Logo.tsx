import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    className={className}
    fill="none"
  >
    <defs>
      <linearGradient id="cyber-grad-logo" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00ff9f" stopOpacity="1" />
        <stop offset="100%" stopColor="#00baee" stopOpacity="1" />
      </linearGradient>
      <filter id="glow-logo" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur"/>
        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
      </filter>
    </defs>

    {/* Background Hexagon */}
    <path d="M256 50 L450 150 V362 L256 462 L62 362 V150 Z" 
          fill="#050505" 
          stroke="#333" 
          strokeWidth="4" />

    {/* Neon Border/Accent */}
    <path d="M450 150 V362 M62 362 V150" 
          stroke="#00ff9f" 
          strokeWidth="6" 
          strokeLinecap="round" 
          filter="url(#glow-logo)" 
          opacity="0.6"/>

    {/* The "A" / Track Symbol */}
    <path d="M170 360 L256 160 L342 360 M195 300 H317" 
          fill="none" 
          stroke="url(#cyber-grad-logo)" 
          strokeWidth="24" 
          strokeLinecap="square" 
          strokeLinejoin="round"
          filter="url(#glow-logo)" />
          
    {/* Tech Details */}
    <rect x="236" y="120" width="40" height="12" fill="#ff0055" />
    <rect x="360" y="340" width="12" height="40" fill="#00ff9f" />
    
    {/* Center Eye/Node */}
    <circle cx="256" cy="280" r="15" fill="#050505" stroke="#ff0055" strokeWidth="4"/>
  </svg>
);