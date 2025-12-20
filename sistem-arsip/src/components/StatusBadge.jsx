import React from 'react';
import { cn } from '../utils/cn';

export default function StatusBadge({ status }) {
    const variants = {
        active: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500'
        },
        inactive: {
            bg: 'bg-neutral-100',
            text: 'text-neutral-600',
            border: 'border-neutral-200',
            dot: 'bg-neutral-400'
        }
    };

    const variant = variants[status] || variants.active;
    const label = status === 'active' ? 'Aktif' : 'Tidak Aktif';

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1",
            "rounded-full text-xs font-medium border",
            variant.bg, variant.text, variant.border
        )}>
            <div className={cn("w-1.5 h-1.5 rounded-full", variant.dot)} />
            {label}
        </div>
    );
}
