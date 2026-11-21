import React from 'react';

/**
 * ShinyText Component (inspired by react-bits)
 * Renders text with a continuous sweeping light shimmer.
 */
export default function ShinyText({ 
  text, 
  disabled = false, 
  speed = 4, 
  className = '',
  shimmerWidth = 100 
}) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text ${className}`}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 100%)',
        backgroundSize: `${shimmerWidth}% 100%`,
        backgroundRepeat: 'no-repeat',
        animation: disabled ? 'none' : `shine ${animationDuration} ease-in-out infinite`,
        WebkitBackgroundClip: 'text',
      }}
    >
      {text}
    </span>
  );
}
