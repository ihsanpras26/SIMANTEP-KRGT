import React from 'react';
import { 
  LayoutDashboard, 
  Archive, 
  FilePlus, 
  FolderKanban, 
  ChevronLeft, 
  ChevronRight,
  Leaf,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { cn } from '../utils/cn';

export function Sidebar({ 
  collapsed, 
  mobileOpen,
  onToggle, 
  onMobileClose,
  currentView, 
  onNavigate,
  onShowInfo
}) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'arsip', label: 'Daftar Arsip', icon: Archive },
    { id: 'tambah', label: 'Tambah Arsip', icon: FilePlus },
    { id: 'klasifikasi', label: 'Klasifikasi', icon: FolderKanban },
  ];



  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
      />

      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen bg-white border-r border-neutral-200 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col shadow-soft",
          // Desktop width
          collapsed ? "md:w-[72px]" : "md:w-72",
          // Mobile width and transform
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-5 border-b border-neutral-100">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all duration-300", collapsed && "justify-center w-full")}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-glow">
            <Leaf size={22} />
          </div>
          <div className={cn("flex flex-col transition-opacity duration-200", collapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
            <span className="font-display font-bold text-neutral-900 text-xl leading-none tracking-tight">SIMANTEP</span>
            <span className="text-[10px] font-bold text-primary-600 tracking-widest uppercase mt-1">UPT Kebun Raya Gunung Tidar</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-8 overflow-y-auto scrollbar-hide">
        {/* Main Group */}
        <div>
          {!collapsed && (
            <h3 className="px-4 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Menu Utama</h3>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "bg-primary-50 text-primary-700 font-medium shadow-sm" 
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                    collapsed && "justify-center px-0 py-3"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}
                  
                  <item.icon 
                    size={22} 
                    className={cn(
                      "flex-shrink-0 transition-colors duration-200",
                      isActive ? "text-primary-600" : "text-neutral-400 group-hover:text-neutral-600"
                    )} 
                  />
                  
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>


      </div>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-500 hover:bg-white hover:text-neutral-900 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-neutral-200",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!collapsed && <span className="text-sm font-medium">Sembunyikan Menu</span>}
        </button>
      </div>
      </aside>
    </>
  );
}
