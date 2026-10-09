import React from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
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
              'relative max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] w-full overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-soft border border-neutral-200',
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const ModalHeader = ({ children, className, onClose }) => (
  <div className={cn('sticky top-0 z-10 flex items-center justify-between gap-3 rounded-t-2xl bg-white p-4 sm:p-6 border-b border-neutral-200', className)}>
    <div className="flex-1">{children}</div>
    {onClose && (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Tutup dialog"
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
  <div className={cn('p-4 sm:p-6', className)}>
    {children}
  </div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn('flex flex-wrap items-center justify-end gap-3 p-4 sm:p-6 border-t border-neutral-200', className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };
