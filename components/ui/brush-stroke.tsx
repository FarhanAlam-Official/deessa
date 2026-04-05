"use client"

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface BrushStrokeProps {
  color?: string;
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  animationDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const BrushStroke: React.FC<BrushStrokeProps> = ({
  color = '#8B8DD4', 
  width = '100%',
  height = '100%',
  animate = true,
  animationDuration = 1.2,
  className = '',
  style = {},
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate || !brushRef.current || !containerRef.current) return;

    // Use GSAP timeline for premium multi-layer staggered reveal
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 85%", 
        toggleActions: "play none none none"
      }
    });

    const layers = brushRef.current.querySelectorAll('.brush-layer');
    
    tl.fromTo(
      layers,
      { scaleX: 0, opacity: 0 },
      {
        scaleX: 1,
        opacity: (i, target) => parseFloat(target.getAttribute('data-target-opacity') || '1'),
        duration: animationDuration,
        ease: "power3.inOut",
        transformOrigin: "left center",
        stagger: 0.15 // Smooth staggered paint stroke effect
      }
    );

    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  }, [animate, animationDuration]);

  // Determine if using default purple for premium gradients
  const usePremiumPurple = color === '#8B8DD4';

  return (
    <div
      ref={containerRef}
      className={`brush-stroke-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        // Soft ambient glow around the whole painted section
        filter: usePremiumPurple ? 'drop-shadow(0px 10px 25px rgba(139, 141, 212, 0.25))' : 'none',
        ...style,
      }}
    >
      <div
        ref={brushRef}
        className="brush-stroke-background"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          willChange: 'transform, opacity'
        }}
      >
        <svg
          preserveAspectRatio="none"
          viewBox="0 0 1000 200"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
        >
          <defs>
            {/* Multi-tone purple gradients for realistic paint depth */}
            <linearGradient id="brush-grad-base" x1="0%" y1="0%" x2="100%" y2="10%">
              <stop offset="0%" stopColor="#5A5CA8" />
              <stop offset="50%" stopColor="#6f72c6" />
              <stop offset="100%" stopColor="#4A4C88" />
            </linearGradient>
            
            <linearGradient id="brush-grad-mid" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7E80CA" />
              <stop offset="60%" stopColor="#8B8DD4" />
              <stop offset="100%" stopColor="#6D6FBC" />
            </linearGradient>
            
            <linearGradient id="brush-grad-top" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#B3B5EB" />
              <stop offset="50%" stopColor="#9C9EE3" />
              <stop offset="100%" stopColor="#8B8DD4" />
            </linearGradient>

            {/* Premium organic roughness filter with noise */}
            <filter id="premium-roughness" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04 0.12" numOctaves="5" result="noise" seed="22"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>

          {/* Layered brush strokes for depth, opacity variance, and realistic texture */}
          <g filter="url(#premium-roughness)">
            {/* Layer 1: Darker, wider base stroke (spreads further) */}
            <path
              className="brush-layer"
              data-target-opacity="0.85"
              fill={usePremiumPurple ? "url(#brush-grad-base)" : color}
              d="M 15,100 C 40,80 80,60 150,55 C 300,50 600,45 750,48 C 850,50 930,65 960,85 C 980,95 990,120 985,140 C 975,160 930,175 850,170 C 600,160 300,165 250,165 C 150,165 80,155 40,145 C 10,135 -10,125 15,100 Z M 15,100 C 25,120 50,75 10,95 Z M 950,135 C 930,155 970,165 980,145 Z"
            />
            
            {/* Layer 2: Main, highly opaque stroke body */}
            <path
              className="brush-layer"
              data-target-opacity="0.95"
              fill={usePremiumPurple ? "url(#brush-grad-mid)" : color}
              d="M 25,105 C 50,85 100,70 200,65 C 400,60 700,55 800,60 C 900,65 940,75 960,90 C 975,100 980,115 975,130 C 965,150 920,160 850,155 C 700,150 400,155 250,155 C 150,155 100,150 50,140 C 20,130 5,120 25,105 Z M 60,65 C 80,45 95,60 85,80 Z"
            />
            
            {/* Layer 3: Subtle top highlight streaks inside the paint */}
            <path
              className="brush-layer"
              data-target-opacity="0.65"
              fill={usePremiumPurple ? "url(#brush-grad-top)" : color}
              d="M 40,110 C 150,85 450,80 850,85 C 920,85 945,95 950,110 C 945,125 900,135 800,130 C 400,120 150,125 60,135 C 30,140 20,125 40,110 Z M 320,40 C 310,25 330,15 340,35 Z M 890,135 C 860,145 880,165 900,155 Z"
            />
          </g>
        </svg>
      </div>

      {/* Text Content Wrapper */}
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          padding: '3rem 4rem', 
          width: '100%',
          // Ensures text pops beautifully off the busy paint texture
          textShadow: '0px 2px 10px rgba(0,0,0,0.15)' 
        }}
      >
        {children}
      </div>
    </div>
  );
};
