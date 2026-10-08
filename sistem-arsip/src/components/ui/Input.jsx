import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const Input = React.forwardRef(({ className, type, label, error, icon: Icon, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(false);

  React.useEffect(() => {
    setHasValue(!!props.value || !!props.defaultValue);
  }, [props.value, props.defaultValue]);

  return (
    <div className="relative">
      {label && (
        <motion.label
          className={cn(
            'absolute left-3 transition-all duration-200 pointer-events-none text-gray-500',
            (isFocused || hasValue) 
              ? 'top-2 text-xs text-primary-600 font-medium' 
              : 'top-1/2 -translate-y-1/2 text-sm'
          )}
          animate={{
            y: (isFocused || hasValue) ? 0 : 0,
            scale: (isFocused || hasValue) ? 0.85 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        
        <motion.input
          type={type}
          className={cn(
            'flex h-12 w-full rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm px-3 py-2 text-sm transition-all duration-200',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            label && (isFocused || hasValue) && 'pt-6 pb-2',
            Icon && 'pl-10',
            error && 'border-red-300 focus:ring-red-500',
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            setHasValue(!!e.target.value);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setHasValue(!!e.target.value);
            props.onChange?.(e);
          }}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          {...props}
        />
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-xs text-red-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };