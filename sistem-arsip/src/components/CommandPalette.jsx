import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Command, FileText, FolderKanban, Plus, Settings, LogOut, X, ArrowRight, Archive } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CommandPalette({
  isOpen,
  onClose,
  navigate,
  actions = [],
  arsipList = [],
  setSelectedArsipDetail
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Default actions
  const defaultActions = [
    { id: 'new-arsip', label: 'Tambah Arsip Baru', icon: Plus, action: () => navigate('tambah') },
    { id: 'dashboard', label: 'Go to Dashboard', icon: Command, action: () => navigate('dashboard') },
    { id: 'all-arsip', label: 'Lihat Semua Arsip', icon: FileText, action: () => navigate('semua') },
    { id: 'klasifikasi', label: 'Kelola Klasifikasi', icon: FolderKanban, action: () => navigate('klasifikasi') },
  ];

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!query) return defaultActions;

    const lowerQuery = query.toLowerCase();

    // Filter actions
    const matchedActions = [...defaultActions, ...actions].filter(item =>
      item.label?.toLowerCase().includes(lowerQuery)
    );

    // Filter archives
    const matchedArchives = arsipList.filter(arsip =>
      arsip.perihal?.toLowerCase().includes(lowerQuery) ||
      arsip.nomorArsip?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5).map(arsip => ({
      id: `arsip-${arsip.id}`,
      label: arsip.perihal,
      subLabel: arsip.nomorArsip,
      icon: Archive,
      action: () => {
        if (setSelectedArsipDetail) setSelectedArsipDetail(arsip);
      }
    }));

    return [...matchedActions, ...matchedArchives];
  }, [query, actions, arsipList]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-900/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 flex flex-col max-h-[60vh] z-10"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100">
              <div className="flex-1 flex items-center bg-neutral-100/80 hover:bg-neutral-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 border border-transparent transition-all duration-200 rounded-2xl px-4 py-2.5">
                <Search className="w-5 h-5 text-neutral-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Pencarian Arsip"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  className="flex-1 text-base bg-transparent border-none outline-none focus:outline-none ring-0 focus:ring-0 appearance-none text-neutral-800 placeholder:text-neutral-400"
                />
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-red-50 rounded-xl text-neutral-400 hover:text-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto p-2">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-neutral-500">
                  <p>Tidak ada hasil ditemukan untuk "{query}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredItems.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors duration-100 ${index === selectedIndex
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${index === selectedIndex ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                          <item.icon size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{item.label}</span>
                          {item.subLabel && (
                            <span className="text-xs text-neutral-400 truncate">{item.subLabel}</span>
                          )}
                        </div>
                      </div>
                      {index === selectedIndex && (
                        <ArrowRight size={16} className="text-primary-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100 text-xs text-neutral-400 flex justify-center">
              <span>Gunakan tombol panah <kbd className="font-sans mx-1">↑↓</kbd> untuk navigasi</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
