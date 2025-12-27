import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// Button Variants - Consistent color and style system
const buttonVariants = {
  // Primary - Main CTA actions
  default: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md border border-primary-600',

  // Destructive - Delete/Remove actions
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md border border-red-600',

  // Outline - Secondary actions
  outline: 'border-2 border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400',

  // Secondary - Lighter secondary actions
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-200',

  // Ghost - Minimal emphasis
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',

  // Subtle - Very low emphasis
  subtle: 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50',

  // Link - Text link style
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto',

  // Success - Positive actions
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md border border-emerald-600',

  // Warning - Caution actions
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md border border-amber-500',
};

// Size Variants - Consistent dimensions
const sizeVariants = {
  xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  default: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
  icon: 'h-10 w-10 rounded-lg p-0',
  iconSm: 'h-8 w-8 rounded-lg p-0',
  iconXs: 'h-7 w-7 rounded-md p-0',
};

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  children,
  ...props
}, ref) => {
  const isIconOnly = size === 'icon' || size === 'iconSm' || size === 'iconXs';

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-300 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        sizeVariants[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? {
        y: -1,
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
        transition: { duration: 0.2, ease: 'easeOut' }
      } : {}}
      whileTap={!disabled && !loading ? {
        y: 0,
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      {...props}
    >
      {loading && (
        <motion.div
          className={cn(
            "border-2 border-current border-t-transparent rounded-full",
            isIconOnly ? "w-4 h-4" : "w-4 h-4"
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {!loading && children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants, sizeVariants };
