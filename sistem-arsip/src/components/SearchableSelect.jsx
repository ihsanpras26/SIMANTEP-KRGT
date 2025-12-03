import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Pilih...",
  className,
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal search term with external value
  useEffect(() => {
    if (value && value !== 'all') {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
      } else {
        setSearchTerm(value);
      }
    } else {
      setSearchTerm('');
    }
  }, [value, options]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        // On blur, if search term doesn't match a value, we might want to keep it or reset?
        // For now, we'll assume the user might have typed a custom code.
        // But if it was empty, ensure we clear.
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    // Optional: if we want to clear the filter when input is cleared
    if (e.target.value === '') {
      onChange('all');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's an exact match in filtered options, select it
      // Otherwise, use the current search term as the value (custom code)
      const exactMatch = filteredOptions.find(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());
      if (exactMatch) {
        handleSelect(exactMatch.value);
      } else {
        onChange(searchTerm || 'all');
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {label && <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-10 py-2.5 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all truncate"
        />
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        
        {searchTerm && (
          <button
            onClick={() => {
              onChange('all');
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 w-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
          >
            {filteredOptions.length > 0 ? (
              <div className="p-1">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group",
                      value === option.value ? "bg-primary-50 text-primary-700" : "text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    <span className="truncate mr-2">{option.label}</span>
                    {value === option.value && <Check size={14} className="text-primary-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-neutral-400">
                Tidak ada hasil. Tekan Enter untuk menggunakan "{searchTerm}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;
