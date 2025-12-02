import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import CommandPalette from './CommandPalette';
import { Toaster } from 'react-hot-toast';
import { cn } from '../utils/cn';

export default function Layout({ 
  children, 
  currentView, 
  onNavigate, 
  user, 
  onLogout,
  title = "Dashboard",
  arsipList = [],
  setSelectedArsipDetail
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Keyboard shortcut removed as per request
  /*
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
  */

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-primary-100 selection:text-primary-900">
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={currentView}
        onNavigate={onNavigate}
        onShowInfo={() => {}} // Handle info modal trigger
      />

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          sidebarCollapsed ? "ml-[72px]" : "ml-72"
        )}
      >
        {/* Header */}
        <Header 
          title={title}
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          isSidebarCollapsed={sidebarCollapsed}
          user={user}
          onLogout={onLogout}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />

        {/* Page Content */}
        <main className="flex-1 pt-24 px-8 pb-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Overlays */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        navigate={onNavigate}
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
