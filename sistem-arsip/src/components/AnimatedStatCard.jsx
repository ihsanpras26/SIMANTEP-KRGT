import React from 'react';
import { motion } from 'framer-motion';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import Tooltip from './Tooltip';

/**
 * AnimatedStatCard - Stat card with animated number counter
 */
export default function AnimatedStatCard({
    title,
    value,
    icon: Icon,
    bgColor = 'bg-blue-50',
    textColor = 'text-blue-600',
    trend,
    trendStyle,
    TrendIcon,
    onClick,
    delay = 0
}) {
    const animatedValue = useAnimatedCounter(value, 1200);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            onClick={onClick}
            className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100 relative overflow-hidden group hover:shadow-soft transition-all duration-300 cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${bgColor} ${textColor}`}>
                    <Icon size={24} />
                </div>
                {trend && TrendIcon && (
                    <Tooltip content="vs bulan lalu">
                        <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${trendStyle}`}>
                            <TrendIcon size={12} className="mr-1" />
                            {trend}
                        </span>
                    </Tooltip>
                )}
            </div>

            <h3 className="text-3xl font-display font-bold text-neutral-900 mb-1 tabular-nums">
                {animatedValue.toLocaleString('id-ID')}
            </h3>
            <p className="text-sm text-neutral-500">{title}</p>

            {/* Decorative background blob */}
            <div
                className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${bgColor.replace('bg-', 'bg-opacity-50 ')} blur-2xl group-hover:scale-150 transition-transform duration-500`}
            />
        </motion.div>
    );
}
