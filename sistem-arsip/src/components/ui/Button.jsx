import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { buttonVariants, sizeVariants } from './buttonVariants';

// Button Variants - Consistent color and style system

// Size Variants - Consistent dimensions

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

export { Button };
