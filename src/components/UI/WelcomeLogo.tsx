
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

type LogoProps = {
  className?: string;
  size?: number;
};

export const WelcomeLogo: React.FC<LogoProps> = ({ className = "", size }) => {
  const id = React.useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use GSAP for all animations
  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Continuous Rotation of the Outer Tech Ring
    gsap.to('.tech-ring', {
      rotation: 360,
      duration: 60,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%'
    });

    // 2. Reverse Rotation of the Middle Hexagon Layer
    gsap.to('.hex-layer', {
      rotation: -360,
      duration: 45,
      repeat: -1,
      ease: 'none',
      transformOrigin: '50% 50%'
    });

    // 3. Orbital Particles - Dynamic independent movement
    gsap.to('.orbital-1', {
      rotation: 360,
      duration: 25,
      repeat: -1,
      ease: 'none',
      transformOrigin: '128px 128px' // Center of SVG
    });
    
    gsap.to('.orbital-2', {
      rotation: -360,
      duration: 30,
      repeat: -1,
      ease: 'none',
      transformOrigin: '128px 128px' // Center of SVG
    });

    // 4. Core Pulse and Float
    gsap.to('.core-group', {
      y: -8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    gsap.to('.core-glow', {
      opacity: 0.8,
      scale: 1.1,
      duration: 2,
      repeat: -1,
      yoyo: true,
      transformOrigin: 'center center',
      ease: 'power1.inOut'
    });

    // 5. Radiating Waves - Staggered expansion
    gsap.fromTo('.wave-ring', 
      { scale: 0.5, opacity: 0, strokeWidth: 4 },
      { 
        scale: 2.2, 
        opacity: 0, 
        strokeWidth: 0,
        duration: 3, 
        repeat: -1, 
        stagger: 1, 
        ease: 'power1.out',
        transformOrigin: 'center center'
      }
    );

  }, { scope: containerRef });

  return (
    <div 
      ref={containerRef}
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
        <defs>
          <linearGradient id={`grad_primary_${id}`} x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary-main)" /> 
            <stop offset="100%" stopColor="var(--primary-hover)" /> 
          </linearGradient>
          
          <linearGradient id={`grad_secondary_${id}`} x1="256" y1="0" x2="0" y2="256" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--border-focus)" /> 
            <stop offset="100%" stopColor="var(--primary-main)" /> 
          </linearGradient>
          
          <linearGradient id={`grad_core_${id}`} x1="128" y1="100" x2="128" y2="156" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="var(--primary-subtle)" />
          </linearGradient>

          <filter id={`glow_soft_${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <filter id={`glow_intense_${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- RADIATING WAVES --- */}
        <g>
             <circle cx="128" cy="128" r="60" stroke={`url(#grad_primary_${id})`} fill="none" className="wave-ring" />
             <circle cx="128" cy="128" r="60" stroke={`url(#grad_secondary_${id})`} fill="none" className="wave-ring" />
             <circle cx="128" cy="128" r="60" stroke={`url(#grad_primary_${id})`} fill="none" className="wave-ring" />
        </g>

        {/* Background Ambient Field */}
        <g style={{ transformOrigin: '128px 128px' }}>
           <circle cx="128" cy="128" r="90" fill={`url(#grad_primary_${id})`} opacity="0.1" filter={`url(#glow_soft_${id})`} />
        </g>

        {/* Outer Tech Ring */}
        <g className="tech-ring">
            {/* Dashed Track */}
            <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="4 8" />
            
            {/* Rotating Arcs */}
            <path d="M128 18 A110 110 0 0 1 238 128" stroke={`url(#grad_secondary_${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.6" filter={`url(#glow_intense_${id})`} />
            <path d="M128 238 A110 110 0 0 1 18 128" stroke={`url(#grad_primary_${id})`} strokeWidth="2" strokeLinecap="round" opacity="0.6" filter={`url(#glow_intense_${id})`} />
            
            {/* Data Nodes on Ring */}
            <circle cx="128" cy="18" r="3" fill={`url(#grad_secondary_${id})`} filter={`url(#glow_intense_${id})`} />
            <circle cx="238" cy="128" r="3" fill={`url(#grad_secondary_${id})`} />
            <circle cx="128" cy="238" r="3" fill={`url(#grad_primary_${id})`} filter={`url(#glow_intense_${id})`} />
            <circle cx="18" cy="128" r="3" fill={`url(#grad_primary_${id})`} />
        </g>

        {/* Middle Geometric Layer - Hexagon & Connections */}
        <g className="hex-layer">
            {/* Hexagon Path */}
            <path 
              d="M128 48 L197 88 V168 L128 208 L59 168 V88 Z" 
              stroke={`url(#grad_primary_${id})`} 
              strokeWidth="1.5" 
              fill="none"
              strokeOpacity="0.4"
            />
            
            {/* Internal connecting lines (Neural Network metaphor) */}
            <path d="M128 48 L128 100" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
            <path d="M197 88 L152 114" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
            <path d="M197 168 L152 142" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
            <path d="M128 208 L128 156" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
            <path d="M59 168 L104 142" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
            <path d="M59 88 L104 114" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.2" />
        </g>

        {/* Inner Orbital System */}
        <g className="orbital-1">
             <ellipse cx="128" cy="128" rx="65" ry="25" stroke={`url(#grad_secondary_${id})`} strokeWidth="1" strokeOpacity="0.3" transform="rotate(45 128 128)" />
             <circle cx="174" cy="82" r="4" fill="var(--primary-main)" transform="rotate(45 128 128)" filter={`url(#glow_intense_${id})`}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
             </circle>
        </g>
        
        <g className="orbital-2">
             <ellipse cx="128" cy="128" rx="65" ry="25" stroke={`url(#grad_primary_${id})`} strokeWidth="1" strokeOpacity="0.3" transform="rotate(-45 128 128)" />
             <circle cx="82" cy="174" r="4" fill="var(--primary-main)" transform="rotate(45 128 128)" filter={`url(#glow_intense_${id})`}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" begin="2s" />
             </circle>
        </g>

        {/* Central Cognitive Core */}
        <g className="core-group">
            {/* Core Glow */}
            <circle className="core-glow" cx="128" cy="128" r="28" fill={`url(#grad_primary_${id})`} opacity="0.4" filter={`url(#glow_intense_${id})`} />
            
            {/* Solid Core */}
            <circle cx="128" cy="128" r="16" fill={`url(#grad_core_${id})`} />
            
            {/* Iris/Lens detail */}
            <circle cx="128" cy="128" r="10" stroke={`url(#grad_primary_${id})`} strokeWidth="1.5" fill="none" opacity="0.8" />
            <circle cx="128" cy="128" r="5" fill={`url(#grad_primary_${id})`} />
        </g>
      </svg>
    </div>
  );
};
