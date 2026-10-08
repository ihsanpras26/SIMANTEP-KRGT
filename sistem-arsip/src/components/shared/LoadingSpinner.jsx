import React from 'react';
import { ClipLoader, BeatLoader, PulseLoader, RingLoader } from 'react-spinners';

/**
 * Komponen LoadingSpinner dengan berbagai variasi
 */
const LoadingSpinner = ({ 
  type = 'clip', 
  size = 20, 
  color = '#3B82F6', 
  className = '',
  loading = true 
}) => {
  const spinnerProps = {
    loading,
    size,
    color,
    className
  };

  switch (type) {
    case 'beat':
      return <BeatLoader {...spinnerProps} />;
    case 'pulse':
      return <PulseLoader {...spinnerProps} />;
    case 'ring':
      return <RingLoader {...spinnerProps} />;
    case 'clip':
    default:
      return <ClipLoader {...spinnerProps} />;
  }
};

/**
 * Spinner untuk tombol dengan teks
 */
export const ButtonSpinner = ({ 
  loading = false, 
  children, 
  loadingText = 'Loading...', 
  className = '',
  ...props 
}) => {
  return (
    <button 
      className={`flex items-center justify-center gap-2 ${className}`} 
      disabled={loading}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          type="clip" 
          size={16} 
          color="currentColor" 
        />
      )}
      {loading ? loadingText : children}
    </button>
  );
};

/**
 * Overlay spinner untuk loading state keseluruhan
 */
export const OverlaySpinner = ({ loading = false, children, message = 'Memuat...' }) => {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg animate-fadeIn">
          <div className="flex flex-col items-center gap-3 bg-white/80 p-4 rounded-xl shadow-lg border border-gray-100">
            <LoadingSpinner 
              type="ring" 
              size={40} 
              color="#3B82F6" 
            />
            <p className="text-sm text-gray-600 font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Inline spinner untuk item yang sedang diproses
 */
export const InlineSpinner = ({ 
  loading = false, 
  size = 16, 
  className = 'ml-2' 
}) => {
  if (!loading) return null;
  
  return (
    <LoadingSpinner 
      type="clip" 
      size={size} 
      color="currentColor" 
      className={className}
    />
  );
};

/**
 * Spinner untuk card/item yang sedang loading
 */
export const CardSpinner = ({ 
  loading = false, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {loading && (
        <div className="absolute top-2 right-2">
          <LoadingSpinner 
            type="clip" 
            size={16} 
            color="#6B7280" 
          />
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;