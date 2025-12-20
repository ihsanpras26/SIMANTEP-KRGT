import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import CommandPalette from './CommandPalette';
import { Toaster } from 'react-hot-toast';
import { cn } from '../utils/cn';

const SIDEBAR_COLLAPSED_KEY = 'simantep_sidebar_collapsed';

export default function Layout({
  children,
  user,
  onLogout,
  title = "Dashboard",
  arsipList = [],
  setSelectedArsipDetail
}) {
  // Initialize sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Global keyboard shortcut for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-primary-100 selection:text-primary-900">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={() => setMobileMenuOpen(false)}
        onShowInfo={() => { }} // Handle info modal trigger
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          "ml-0", // Mobile: no margin
          sidebarCollapsed ? "md:ml-[72px]" : "md:ml-72" // Desktop: responsive margin
        )}
      >
        {/* Header */}
        <Header
          title={title}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          isSidebarCollapsed={sidebarCollapsed}
          user={user}
          onLogout={onLogout}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        {/* Page Content */}
        <main className="flex-1 pt-24 px-4 md:px-8 pb-8 overflow-x-hidden">
          <div className="max-w-screen-2xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        arsipList={arsipList}
        setSelectedArsipDetail={setSelectedArsipDetail}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1e293b',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
