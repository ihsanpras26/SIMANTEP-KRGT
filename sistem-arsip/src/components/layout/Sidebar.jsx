import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Archive, FilePlus, FolderKanban, ChevronLeft, ChevronRight, Leaf, Tag, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import logo from '../../assets/favicon.svg';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Daftar Arsip', icon: Archive, path: '/arsip' },
  { label: 'Tambah Arsip', icon: FilePlus, path: '/arsip/tambah' },
  { label: 'Label & Kategori', icon: Tag, path: '/label' },
  { label: 'Klasifikasi', icon: FolderKanban, path: '/klasifikasi' },
];

export function Sidebar({ collapsed, isDesktop, mobileOpen, onToggle, onMobileClose, onNavigate }) {
  const location = useLocation();
  const sidebarRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen || isDesktop) return;
    const previousFocus = document.getElementById('mobile-menu-toggle') || document.activeElement;
    const sidebar = sidebarRef.current;
    const focusFrame = requestAnimationFrame(() => sidebar.querySelector('button')?.focus());
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); onMobileClose(); }
      if (event.key === 'Tab') {
        const controls = [...sidebar.querySelectorAll('a[href], button:not([disabled])')].filter(node => node.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKey);
      requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [mobileOpen, isDesktop, onMobileClose]);

  return (
    <>
      {mobileOpen && !isDesktop && <div className="fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-[2px] lg:hidden" onClick={onMobileClose} aria-hidden="true" />}
      <aside ref={sidebarRef} id="app-sidebar" role={mobileOpen && !isDesktop ? 'dialog' : undefined} aria-modal={mobileOpen && !isDesktop ? true : undefined} aria-hidden={!isDesktop && !mobileOpen ? true : undefined} aria-label="Navigasi utama" inert={!isDesktop && !mobileOpen ? '' : undefined} className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[calc(100vw-2rem)] max-w-72 flex-col border-r border-neutral-200 bg-white transition-[width,translate] duration-200 lg:max-w-none lg:translate-x-0 lg:pointer-events-auto',
        collapsed ? 'lg:w-20' : 'lg:w-60',
        mobileOpen ? 'translate-x-0 shadow-soft' : '-translate-x-full pointer-events-none',
      )}>
        <div className={cn('flex h-[72px] shrink-0 items-center border-b border-neutral-200 px-5', collapsed && 'justify-center px-3')}>
          <Link to="/" onClick={() => { onNavigate?.('/'); onMobileClose(); }} aria-label="SIMANTEP, Dashboard" className="flex min-w-0 items-center gap-3 rounded-lg">
            <img src={logo} alt="" className="h-9 w-9 shrink-0 object-contain" />
            {!collapsed && <span className="min-w-0"><span className="block text-lg font-bold tracking-tight text-neutral-900">SIMANTEP</span><span className="block text-[11px] font-medium text-neutral-500">Kebun Raya Gunung Tidar</span></span>}
          </Link>
          {mobileOpen && !isDesktop && <button type="button" onClick={onMobileClose} aria-label="Tutup menu navigasi" className="app-icon-button ml-auto lg:hidden"><X size={20} /></button>}
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          {!collapsed && <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">Menu utama</p>}
          <nav aria-label="Menu utama" className="space-y-1.5">
            {navItems.map(item => {
              const active = item.path === '/' ? location.pathname === '/'
                : item.path === '/arsip' ? (location.pathname.startsWith('/arsip') && location.pathname !== '/arsip/tambah') || location.pathname === '/semua-arsip'
                : location.pathname.startsWith(item.path);
              return <Link key={item.path} to={item.path} onClick={() => { onNavigate?.(item.path); onMobileClose(); }} aria-label={item.label} aria-current={active ? 'page' : undefined} title={collapsed ? item.label : undefined} className={cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                active ? 'bg-primary-50 text-primary-800' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                collapsed && 'justify-center px-0',
              )}>
                <item.icon size={20} aria-hidden="true" className={cn('shrink-0', active ? 'text-primary-700' : 'text-neutral-500')} />
                {!collapsed && <span>{item.label}</span>}
              </Link>;
            })}
          </nav>
        </div>
        <div className="space-y-3 border-t border-neutral-200 p-3">
          {!collapsed && <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3"><Leaf size={20} className="shrink-0 text-primary-700" /><div><p className="text-xs font-semibold text-neutral-700">UPT Kebun Raya</p><p className="text-xs text-neutral-500">Gunung Tidar · Magelang</p></div></div>}
          <button type="button" onClick={onToggle} aria-label={collapsed ? 'Perluas menu navigasi' : 'Ringkas menu navigasi'} aria-expanded={!collapsed} className={cn('hidden min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-neutral-600 hover:bg-neutral-50 lg:flex', collapsed && 'justify-center px-0')}>
            {collapsed ? <ChevronRight size={19} /> : <ChevronLeft size={19} />}{!collapsed && <span>Ringkas menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
