import React, { useEffect, useRef, useState } from 'react';
import { Search, Menu, ChevronDown, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function Header({ title, onMenuClick, mobileMenuOpen, user, onLogout, onOpenCommandPalette }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const logoutRef = useRef(null);
  const displayName = user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    if (!showUserMenu) return;
    logoutRef.current?.focus();
    const closeOutside = event => {
      if (!menuRef.current?.contains(event.target)) setShowUserMenu(false);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [showUserMenu]);

  return (
    <header className="app-header sticky top-0 z-30 flex h-[72px] min-w-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button id="mobile-menu-toggle" type="button" onClick={onMenuClick} aria-label="Buka menu navigasi" aria-expanded={mobileMenuOpen} aria-controls="app-sidebar" className="app-icon-button lg:hidden">
          <Menu size={21} />
        </button>
        <div className="min-w-0">
          <p className="hidden text-xs font-medium text-neutral-500 sm:block">Ruang kerja arsip</p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl" title={title}>{title}</h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button type="button" onClick={onOpenCommandPalette} aria-label="Cari arsip, Ctrl atau Command K" className="flex h-11 w-11 items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 md:w-56 md:justify-start md:px-3 xl:w-64">
          <Search size={18} aria-hidden="true" />
          <span className="hidden flex-1 text-left text-sm md:block">Cari arsip...</span>
          <kbd className="hidden rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[11px] text-neutral-500 md:block">⌘ / Ctrl K</kbd>
        </button>
        <div className="hidden h-8 w-px bg-neutral-200 sm:block" aria-hidden="true" />
        <div ref={menuRef} className="relative">
          <button ref={accountButtonRef} type="button" onClick={() => setShowUserMenu(value => !value)} aria-label={`Menu akun ${displayName}`} aria-expanded={showUserMenu} aria-controls="account-menu" className="flex min-h-11 items-center gap-2 rounded-xl p-1 text-neutral-700 hover:bg-neutral-50 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary-100 bg-primary-50 text-sm font-semibold text-primary-700">{displayName[0].toUpperCase()}</span>
            <span className="hidden min-w-0 text-left xl:block">
              <span className="block max-w-32 truncate text-sm font-semibold">{displayName}</span>
              <span className="block text-xs text-neutral-500">Administrator</span>
            </span>
            <ChevronDown size={14} className="hidden text-neutral-500 sm:block" aria-hidden="true" />
          </button>
          <AnimatePresence>
            {showUserMenu && (
              <motion.div id="account-menu" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-soft">
                <div className="border-b border-neutral-100 p-4">
                  <p className="text-xs text-neutral-500">Masuk sebagai</p>
                  <p className="mt-1 break-all text-sm font-medium text-neutral-800">{user?.email || displayName}</p>
                </div>
                <div className="p-1.5">
                  <button ref={logoutRef} type="button" onClick={() => { setShowUserMenu(false); onLogout(); }} className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm font-medium text-danger-700 hover:bg-danger-50">
                    <LogOut size={17} />Keluar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
