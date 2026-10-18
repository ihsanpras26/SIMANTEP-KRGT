import { useEffect, useRef, useState } from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import { Search, Menu, ChevronDown, LogOut, ChevronRight } from 'lucide-react';

export function Header({
  title,
  onMenuClick,
  mobileMenuOpen,
  user,
  onLogout,
  onOpenCommandPalette,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const logoutRef = useRef(null);
  const displayName = user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    if (!showUserMenu) return;
    logoutRef.current?.focus();
    const closeOutside = (event) => {
      if (!menuRef.current?.contains(event.target)) setShowUserMenu(false);
    };
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showUserMenu]);

  return (
    <header className="app-header">
      <div className="header-location">
        <button
          id="mobile-menu-toggle"
          type="button"
          onClick={onMenuClick}
          aria-label={
            mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
          }
          aria-expanded={mobileMenuOpen}
          aria-controls="app-sidebar"
          className="icon-button mobile-menu-toggle"
        >
          <Menu size={20} />
        </button>
        <span className="header-workspace">Ruang kerja</span>
        <ChevronRight
          size={13}
          className="header-breadcrumb-divider"
          aria-hidden="true"
        />
        <span className="header-title">{title}</span>
      </div>
      <div className="header-actions">
        <ThemeToggle />
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="header-search"
          aria-label="Cari arsip, Control atau Command K"
        >
          <Search size={17} aria-hidden="true" />
          <span>Cari arsip…</span>
          <kbd>⌘ K</kbd>
        </button>
        {onLogout ? (
          <div
            ref={menuRef}
            className="account-menu"
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setShowUserMenu(false);
            }}
          >
            <button
              ref={accountButtonRef}
              type="button"
              onClick={() => setShowUserMenu((value) => !value)}
              aria-label={`Menu akun ${displayName}`}
              aria-expanded={showUserMenu}
              aria-controls="account-menu"
              className="account-toggle"
            >
              <span className="account-avatar">
                {displayName[0].toUpperCase()}
              </span>
              <ChevronDown size={13} aria-hidden="true" />
            </button>
            {showUserMenu && (
              <div id="account-menu" className="account-popover">
                <p className="account-label">Administrator</p>
                <p className="account-email">{user?.email || displayName}</p>
                <button
                  ref={logoutRef}
                  type="button"
                  className="account-logout"
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut size={16} />
                  Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">
            Mode development
          </span>
        )}
      </div>
    </header>
  );
}
