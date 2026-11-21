import React, { useState } from 'react';

/**
 * UiverseButton Component (inspired by uiverse.io & emil-design-eng)
 * High-craft tactile button with glowing border, shine animation, and press physics.
 */
export default function UiverseButton({
  children,
  variant = 'primary', // 'primary' | 'glow' | 'glass' | 'cyber' | 'outline' | 'subtle'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconRight: IconRight,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props
}) {
  const [coords, setCoords] = useState({ x: -1, y: -1 });
  const [isRippling, setIsRippling] = useState(false);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 500);

    if (onClick && !disabled) {
      onClick(e);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-4 py-2.5 text-xs sm:text-sm rounded-xl sm:rounded-2xl gap-2',
    lg: 'px-6 py-3.5 text-sm sm:text-base rounded-2xl gap-2.5 font-bold',
  }[size] || 'px-4 py-2.5 text-sm rounded-xl gap-2';

  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/25 border border-emerald-500/50',
    glow: 'relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/40 hover:shadow-emerald-500/50 hover:brightness-105',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/10 hover:bg-white dark:hover:bg-slate-800 shadow-sm',
    cyber: 'bg-slate-950 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 shadow-lg shadow-emerald-950/40 hover:text-emerald-300 font-mono',
    outline: 'bg-transparent text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60',
    subtle: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-transparent',
  }[variant] || 'bg-emerald-600 text-white';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out active:scale-[0.97] active:duration-75 select-none disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 group overflow-hidden ${sizeClasses} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {/* UIverse Sweeping Shine Reflection Overlay */}
      {variant === 'glow' && (
        <span className="pointer-events-none absolute -inset-full top-0 block -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shine-sweep" />
      )}

      {/* Ripple click feedback */}
      {isRippling && (
        <span
          className="pointer-events-none absolute rounded-full bg-white/30 animate-ping-once"
          style={{
            left: coords.x - 10,
            top: coords.y - 10,
            width: 20,
            height: 20,
          }}
        />
      )}

      {Icon && <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />}
      <span className="relative z-10 truncate">{children}</span>
      {IconRight && <IconRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />}
    </button>
  );
}
