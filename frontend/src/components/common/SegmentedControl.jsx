import React, { useRef, useEffect, useState } from 'react';

/**
 * SegmentedControl Component (inspired by mobbin.com & apple-design)
 * Tactile segmented switcher with sliding indicator pill and spring ease.
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md', // 'sm' | 'md'
  className = '',
  pillClassName = '',
}) {
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeElement = containerRef.current.querySelector(`[data-value="${value}"]`);
    if (activeElement) {
      setIndicatorStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [value, options]);

  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-1.5 text-xs sm:text-sm',
  }[size] || 'p-1.5 text-xs sm:text-sm';

  const btnPadding = {
    sm: 'px-2.5 py-1',
    md: 'px-3.5 py-1.5',
  }[size] || 'px-3.5 py-1.5';

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 select-none ${sizeClasses} ${className}`}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 rounded-xl bg-white dark:bg-slate-800 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${pillClassName}`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {options.map((option) => {
        const isSelected = value === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            data-value={option.value}
            onClick={() => onChange(option.value)}
            className={`relative z-10 flex items-center justify-center gap-1.5 font-medium transition-colors duration-200 rounded-xl active:scale-[0.98] ${btnPadding} ${
              isSelected
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {Icon && <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />}
            <span>{option.label}</span>
            {option.badge && (
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                isSelected 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                  : 'bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
