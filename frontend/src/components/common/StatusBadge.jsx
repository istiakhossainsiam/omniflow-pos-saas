import React from 'react';

/**
 * StatusBadge Component (inspired by uiverse.io & mobbin.com)
 * Status pill with an animated radar ping dot and crisp typography.
 */
const STATUS_CONFIGS = {
  active: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
    ring: 'bg-emerald-400',
  },
  pending: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    dot: 'bg-amber-500',
    ring: 'bg-amber-400',
  },
  error: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500',
    ring: 'bg-rose-400',
  },
  neutral: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20',
    dot: 'bg-slate-400',
    ring: 'bg-slate-300',
  },
};

const SIZE_CONFIGS = {
  xs: 'px-2 py-0.5 text-[10px] gap-1',
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-xs sm:text-sm gap-2',
};

export default function StatusBadge({
  status = 'active', // 'active' | 'pending' | 'error' | 'neutral'
  label,
  sublabel,
  size = 'sm', // 'xs' | 'sm' | 'md'
  pulse = true,
  className = '',
}) {
  const normalizedStatus = (status || 'active').toLowerCase();
  const config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.active;
  const sizeClass = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold select-none ${config.bg} ${sizeClass} ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ring}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {label && <span>{label}</span>}
      {sublabel && (
        <span className="opacity-75 text-[10px] font-normal border-l border-current/20 pl-1.5 ml-0.5">
          {sublabel}
        </span>
      )}
    </span>
  );
}
