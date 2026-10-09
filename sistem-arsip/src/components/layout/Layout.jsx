import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import CommandPalette from './CommandPalette';
import { Toaster } from 'react-hot-toast';

const SIDEBAR_COLLAPSED_KEY = 'simantep_sidebar_collapsed';

export default function Layout({
  children,
  user,
  onLogout,
  title = "Dashboard",
  arsipList = [],
  setSelectedArsipDetail,
  onNavigate
}) {
  // Initialize sidebar state from localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      return saved ? JSON.parse(saved) === true : false;
    } catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  const location = useLocation();
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = event => { setIsDesktop(event.matches); setMobileMenuOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileMenuOpen || isDesktop) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileMenuOpen, isDesktop]);

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
    <div className="app-shell min-h-dvh bg-neutral-50 font-sans text-neutral-900" style={{ '--sidebar-width': sidebarCollapsed ? '5rem' : '15rem' }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={isDesktop && sidebarCollapsed}
        isDesktop={isDesktop}
        mobileOpen={mobileMenuOpen}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onMobileClose={closeMobileMenu}
        onNavigate={onNavigate}
      />

      {/* Main Content Area */}
      <div
        inert={mobileMenuOpen && !isDesktop ? '' : undefined}
        className="app-frame flex min-h-dvh min-w-0 flex-col transition-[margin-left] duration-200 lg:ml-[var(--sidebar-width)]"
      >
        <a href="#main-content" className="skip-link">Lewati ke konten</a>
        {/* Header */}
        <Header
          title={title}
          onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
          user={user}
          onLogout={onLogout}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        {/* Page Content */}
        <main id="main-content" tabIndex={-1} className="app-main min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px] animate-fade-in">
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
