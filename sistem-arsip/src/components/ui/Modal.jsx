import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

const Modal = ({ isOpen, onClose, children, className, size = 'default' }) => {
  const sizeClasses = {
    sm: 'max-w-md',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={cn(
              'relative w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ModalHeader = ({ children, className, onClose }) => (
  <div className={cn('flex items-center justify-between p-6 pb-4 border-b border-gray-200/50', className)}>
    <div className="flex-1">{children}</div>
    {onClose && (
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="h-8 w-8 rounded-full hover:bg-gray-100"
      >
        <X size={16} />
      </Button>
    )}
  </div>
);

const ModalTitle = ({ children, className }) => (
  <h2 className={cn('text-xl font-semibold text-gray-900', className)}>
    {children}
  </h2>
);

const ModalDescription = ({ children, className }) => (
  <p className={cn('text-sm text-gray-600 mt-1', className)}>
    {children}
  </p>
);

const ModalContent = ({ children, className }) => (
  <div className={cn('p-6', className)}>
    {children}
  </div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn('flex items-center justify-end gap-3 p-6 pt-4 border-t border-gray-200/50', className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };