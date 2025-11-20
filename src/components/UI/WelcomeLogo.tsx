
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

type LogoProps = {
  className?: string;
  size?: number;
};

export const WelcomeLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  // Generate a unique ID to prevent ID collisions in DOM
  const id = React.useId().replace(/:/g, '');

  return (
    <div 
      className={`${className} relative flex items-center justify-center`} 
      style={size ? { width: size, height: size } : {}}
      role="img"
      aria-label="Agentic AI Logo"
    >
      <svg
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <style>
          {`
            .spin-slow-${id} { animation: spin-${id} 30s linear infinite; }
            .spin-mid-${id} { animation: spin-${id} 20s linear infinite; }
            .spin-fast-${id} { animation: spin-${id} 12s linear infinite; }
            .spin-reverse-slow-${id} { animation: spin-${id} 25s linear infinite reverse; }
            .pulse-${id} { animation: pulse-${id} 4s ease-in-out infinite; }
            .float-${id} { animation: float-${id} 6s ease-in-out infinite; }
            
            @keyframes spin-${id} { 100% { transform: rotate(360deg); } }
            @keyframes pulse-${id} { 
              0%, 100% { opacity: 0.8; transform: scale(1); } 
              50% { opacity: 1; transform: scale(1.05); } 
            }
            @keyframes float-${id} {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }
          `}
        </style>
        
        <defs>
          <linearGradient id={`grad_primary_${id}`} x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" /> {/* Indigo-500 */}
            <stop offset="100%" stopColor="#a855f7" /> {/* Purple-500 */}
          </linearGradient>
          
          <linearGradient id={`grad_secondary_${id}`} x1="256" y1="0" x2="0" y2="256" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan-500 */}
            <stop offset="100%" stopColor="#3b82f6" /> {/* Blue-500 */}
          </linearGradient>
          
          <linearGradient id={`grad_core_${id}`} x1="128" y1="100" x2="128" y2="156" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>

          <filter id={`glow_soft_${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id={`glow_intense_${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Ambient Field */}
        <g className={`pulse-${id}`} style={{ transformOrigin: '128px 128px' }}>
           <circle cx="128" cy="128" r="80" fill={`url(#grad_primary_${id})`} opacity="0.08" filter={`url(#glow_soft_${id})`} />
        </g>

        {/* Outer Tech Ring */}
        <g className={`origin-center spin-slow-${id}`}>
            {/* Dashed Track */}
            <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="1" strokeOpacity="0.1" strokeDasharray="2 8" />
            
            {/* Rotating Arcs */}
            <path d="M128 18 A110 110 0 0 1 238 128" stroke={`url(#grad_secondary_${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <path d="M128 238 A110 110 0 0 1 18 128" stroke={`url(#grad_primary_${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            
            {/* Data Nodes on Ring */}
            <circle cx="128" cy="18" r="3" fill={`url(#grad_secondary_${id})`} />
            <circle cx="238" cy="128" r="3" fill={`url(#grad_secondary_${id})`} />
            <circle cx="128" cy="238" r="3" fill={`url(#grad_primary_${id})`} />
            <circle cx="18" cy="128" r="3" fill={`url(#grad_primary_${id})`} />
        </g>

        {/* Middle Geometric Layer - Hexagon & Connections */}
        <g className={`origin-center spin-reverse-slow-${id}`}>
            {/* Hexagon Path */}
            <path 
              d="M128 48 L197 88 V168 L128 208 L59 168 V88 Z" 
              stroke={`url(#grad_primary_${id})`} 
              strokeWidth="1.5" 
              fill="none"
              strokeOpacity="0.4"
            />
            
            {/* Internal connecting lines (Neural Network metaphor) */}
            <path d="M128 48 L128 100" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M197 88 L152 114" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M197 168 L152 142" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M128 208 L128 156" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M59 168 L104 142" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
            <path d="M59 88 L104 114" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" />
        </g>

        {/* Inner Orbital System */}
        <g className={`origin-center spin-mid-${id}`}>
             <ellipse cx="128" cy="128" rx="60" ry="20" stroke={`url(#grad_secondary_${id})`} strokeWidth="1" strokeOpacity="0.3" transform="rotate(45 128 128)" />
             <ellipse cx="128" cy="128" rx="60" ry="20" stroke={`url(#grad_primary_${id})`} strokeWidth="1" strokeOpacity="0.3" transform="rotate(-45 128 128)" />
             
             {/* Electrons */}
             <circle cx="170" cy="86" r="4" fill="white" transform="rotate(45 128 128)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
             </circle>
             <circle cx="86" cy="170" r="4" fill="white" transform="rotate(45 128 128)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" begin="1.5s" />
             </circle>
        </g>

        {/* Central Cognitive Core */}
        <g className={`float-${id}`}>
            {/* Core Glow */}
            <circle cx="128" cy="128" r="24" fill={`url(#grad_primary_${id})`} opacity="0.4" filter={`url(#glow_intense_${id})`} />
            
            {/* Solid Core */}
            <circle cx="128" cy="128" r="14" fill={`url(#grad_core_${id})`} />
            
            {/* Iris/Lens detail */}
            <circle cx="128" cy="128" r="8" stroke={`url(#grad_primary_${id})`} strokeWidth="1.5" fill="none" opacity="0.8" />
            <circle cx="128" cy="128" r="4" fill={`url(#grad_primary_${id})`} />
        </g>
      </svg>
    </div>
  );
};
