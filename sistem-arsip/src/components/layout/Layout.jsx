import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import CommandPalette from "./CommandPalette";
import { lockBodyScroll } from "../ui/dialogState";

const SIDEBAR_COLLAPSED_KEY = "simantep_sidebar_collapsed";

export default function Layout({
  children,
  user,
  onLogout,
  title = "Dashboard",
  setSelectedArsipDetail,
  onNavigate,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia("(min-width: 1024px)").matches,
  );
  const location = useLocation();
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeCommandPalette = useCallback(
    () => setShowCommandPalette(false),
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = (event) => {
      setIsDesktop(event.matches);
      setMobileMenuOpen(false);
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(
    () => setMobileMenuOpen(false),
    [location.pathname, location.search],
  );
  useEffect(() => {
    if (mobileMenuOpen && !isDesktop) return lockBodyScroll();
  }, [mobileMenuOpen, isDesktop]);
  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        JSON.stringify(sidebarCollapsed),
      );
    } catch {
      /* Storage is optional. */
    }
  }, [sidebarCollapsed]);
  useEffect(() => {
    const handleKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMobileMenuOpen(false);
        setShowCommandPalette((value) => !value);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div
      className="app-shell"
      style={{ "--sidebar-width": sidebarCollapsed ? "88px" : "248px" }}
    >
      <Sidebar
        collapsed={isDesktop && sidebarCollapsed}
        isDesktop={isDesktop}
        mobileOpen={mobileMenuOpen}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        onMobileClose={closeMobileMenu}
        onNavigate={onNavigate}
      />
      <div
        className="app-frame"
        inert={mobileMenuOpen && !isDesktop ? "" : undefined}
      >
        <a href="#main-content" className="skip-link">
          Lewati ke konten
        </a>
        <Header
          title={title}
          onMenuClick={() => setMobileMenuOpen((value) => !value)}
          mobileMenuOpen={mobileMenuOpen}
          user={user}
          onLogout={onLogout}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />
        <main id="main-content" tabIndex={-1} className="app-main">
          <div className="app-content">{children}</div>
        </main>
        <footer className="app-footer">
          <span>
            SIMANTEP <span aria-hidden="true">/</span> Kebun Raya Gunung Tidar
          </span>
          <span>Ruang arsip digital</span>
        </footer>
      </div>
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={closeCommandPalette}
        setSelectedArsipDetail={setSelectedArsipDetail}
        onNavigate={onNavigate}
      />
    </div>
  );
}
