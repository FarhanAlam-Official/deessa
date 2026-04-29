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
    <>
      {/* Mobile-only padding override — does NOT affect desktop (≥768px) at all */}
      <style>{`
        @media (max-width: 767px) {
          .brush-content-inner {
            padding-top: 2.5rem !important;
            padding-bottom: 2.5rem !important;
            padding-left: 1.25rem !important;
            padding-right: 1.25rem !important;
          }
        }
      `}</style>
      <div
        ref={containerRef}
        className={`brush-stroke-container ${className}`}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width,
          // Soft ambient glow around the whole painted section
          filter: usePremiumPurple ? 'drop-shadow(0px 10px 25px rgba(139, 141, 212, 0.25))' : 'none',
          ...style,
        }}
      >
        {/* SVG background — absolute, fills the container entirely */}
        <div
          ref={brushRef}
          className="brush-stroke-background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            willChange: 'transform, opacity',
            pointerEvents: 'none',
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

            {/*
              PATHS span the FULL viewBox (y≈2 → y≈198).
              This ensures paint covers the entire container height regardless
              of how tall the container becomes on mobile with wrapped text.
            */}
            <g filter="url(#premium-roughness)">
              {/* Layer 1: Wide base stroke — spans full viewBox height */}
              <path
                className="brush-layer"
                data-target-opacity="0.85"
                fill={usePremiumPurple ? "url(#brush-grad-base)" : color}
                d="M 8,100 C 35,4 80,2 155,5 C 310,3 600,2 755,4 C 855,5 935,15 965,45 C 985,70 995,110 990,148 C 980,178 935,196 855,196 C 605,195 310,197 255,197 C 155,196 82,188 42,176 C 10,162 -10,140 8,100 Z"
              />

              {/* Layer 2: Main stroke body — spans full viewBox height */}
              <path
                className="brush-layer"
                data-target-opacity="0.95"
                fill={usePremiumPurple ? "url(#brush-grad-mid)" : color}
                d="M 18,100 C 48,8 102,3 205,6 C 408,4 705,3 808,6 C 908,10 948,22 968,55 C 984,82 990,118 984,152 C 974,182 928,197 858,194 C 708,190 408,193 255,193 C 155,190 104,181 52,168 C 18,152 2,128 18,100 Z"
              />

              {/* Layer 3: Top highlight — spans full viewBox height */}
              <path
                className="brush-layer"
                data-target-opacity="0.65"
                fill={usePremiumPurple ? "url(#brush-grad-top)" : color}
                d="M 38,100 C 152,12 455,5 858,10 C 928,11 952,24 958,65 C 954,110 908,180 808,178 C 455,172 152,178 62,186 C 28,188 18,150 38,100 Z"
              />
            </g>
          </svg>
        </div>

        {/* Text Content Wrapper */}
        <div
          className="brush-content-inner"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '3rem 4rem',
            width: '100%',
            boxSizing: 'border-box',
            textShadow: '0px 2px 10px rgba(0,0,0,0.15)'
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};
