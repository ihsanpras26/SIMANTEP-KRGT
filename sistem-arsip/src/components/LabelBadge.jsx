import React from 'react';
import { cn } from '../utils/cn';

// Predefined professional colors mapping for better UI consistency
// If the color hex matches one of these keys, we use the specific styles
// Otherwise we use inline styles with opacity
const COLOR_VARIANTS = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    lime: 'bg-lime-50 text-lime-700 border-lime-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    stone: 'bg-stone-50 text-stone-700 border-stone-200',
    neutral: 'bg-neutral-50 text-neutral-700 border-neutral-200',
};

// If label.color contains a hex code, we try to match it to a tailwind color name if possible,
// or use it as a raw style.
// For this app, we will store color names (e.g., 'blue', 'red') or hex codes.

export default function LabelBadge({ label, className, size = 'sm', showDelete = false, onDelete }) {
    if (!label) return null;

    const colorClass = COLOR_VARIANTS[label.color] || COLOR_VARIANTS['neutral'];

    // Custom style if it's a hex code and not in variants (fallback)
    const style = !COLOR_VARIANTS[label.color] && label.color.startsWith('#')
        ? {
            backgroundColor: `${label.color}10`,
            color: label.color,
            borderColor: `${label.color}30`
        }
        : {};

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full font-medium border transition-all",
                size === 'sm' ? "text-xs px-2.5 py-0.5" : "text-sm px-3 py-1",
                colorClass,
                className
            )}
            style={style}
        >
            <span
                className={cn(
                    "rounded-full",
                    size === 'sm' ? "w-1.5 h-1.5" : "w-2 h-2"
                )}
                style={{
                    backgroundColor: !COLOR_VARIANTS[label.color] && label.color.startsWith('#')
                        ? label.color
                        : undefined
                }}
                className={cn(
                    // If we have a class, we need a way to set the dot color. 
                    // Tailwind arbitrary values usually work but here we rely on the parent text color 
                    // or specific logic. For simplicity, let's assume the dot uses `currentColor` or 
                    // we map dot backgrounds too.
                    // Actually, let's simple use 'bg-current' with opacity if possible, or mapping.
                    "bg-current opacity-80"
                )}
            />
            {label.name}
            {showDelete && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(label);
                    }}
                    className="ml-1 hover:bg-black/5 rounded-full p-0.5 transition-colors"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </span>
    );
}
