import React from 'react';

/**
 * DotGridBackground Component (inspired by react-bits)
 * Renders an ambient dot-matrix background with soft radial light blooms.
 */
export default function DotGridBackground({
  children,
  className = '',
  dotColor = 'rgba(148, 163, 184, 0.22)',
  glowColor1 = 'rgba(16, 185, 129, 0.08)', // subtle emerald
  glowColor2 = 'rgba(99, 102, 241, 0.06)', // subtle indigo
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Dot Grid */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Ambient Radial Color Mesh Blooms */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full blur-3xl opacity-70 animate-pulse-glow"
        style={{ background: glowColor1 }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl opacity-60 animate-pulse-glow"
        style={{ background: glowColor2, animationDelay: '3s' }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
