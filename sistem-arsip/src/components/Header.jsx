import React, { useState } from 'react';
import { Search, Bell, Menu, Command, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';

export function Header({ 
  title, 
  onMenuClick, 
  isSidebarCollapsed,
  user,
  onLogout,
  onOpenCommandPalette
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 z-30 h-20 transition-all duration-300 px-8 flex items-center justify-between",
        "bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm",
        isSidebarCollapsed ? "left-[72px]" : "left-72"
      )}
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-2xl font-display font-bold text-neutral-800 tracking-tight">{title}</h1>
          <p className="text-xs text-neutral-500 font-medium hidden sm:block">Sistem Informasi Manajemen Arsip Terpadu</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        {/* Command Palette Trigger */}
        <button 
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-neutral-100/50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-sm text-neutral-500 transition-all duration-200 group w-64"
        >
          <Search size={18} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
          <span className="flex-1 text-left">Cari apa saja...</span>
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded border border-neutral-200 text-xs font-medium text-neutral-400">
            <Command size={10} />
            <span>K</span>
          </div>
        </button>

        <div className="h-8 w-px bg-neutral-200 hidden sm:block" />

        <div className="flex items-center gap-4">
          <button className="relative p-2.5 text-neutral-500 hover:bg-neutral-100 hover:text-primary-600 rounded-xl transition-all duration-200">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger-500 rounded-full border-2 border-white shadow-sm" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center text-primary-700 font-bold border border-white shadow-sm">
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block text-left mr-2">
                <p className="text-sm font-semibold text-neutral-700 leading-none">{user?.email?.split('@')[0] || 'Admin'}</p>
                <p className="text-[10px] text-neutral-500 font-medium mt-1">Administrator</p>
              </div>
              <ChevronDown size={14} className="text-neutral-400" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-neutral-50 bg-neutral-50/50">
                      <p className="text-sm font-medium text-neutral-900">Signed in as</p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email || 'admin@simantep.com'}</p>
                    </div>
                    <div className="p-1">
                      <button 
                        onClick={() => {
                          onLogout();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
