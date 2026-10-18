import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Archive,
  Plus,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
  Tag,
  X,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { focusableElements } from "../ui/dialogState";
import logo from "../../assets/favicon.svg";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Daftar arsip", icon: Archive, path: "/arsip" },
  { label: "Label arsip", icon: Tag, path: "/label" },
  { label: "Klasifikasi", icon: FolderKanban, path: "/klasifikasi" },
];

export function Sidebar({
  collapsed,
  isDesktop,
  mobileOpen,
  onToggle,
  onMobileClose,
  onNavigate,
}) {
  const location = useLocation();
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (!mobileOpen || isDesktop) return;
    const previousFocus =
      document.getElementById("mobile-menu-toggle") || document.activeElement;
    const sidebar = sidebarRef.current;
    const frame = requestAnimationFrame(() =>
      sidebar.querySelector("button")?.focus(),
    );
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onMobileClose();
      }
      if (event.key === "Tab") {
        const controls = focusableElements(sidebar);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [mobileOpen, isDesktop, onMobileClose]);
  const select = (path) => {
    onNavigate?.(path);
    onMobileClose();
  };

  return (
    <>
      {mobileOpen && !isDesktop && (
        <div
          className="sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        role={mobileOpen && !isDesktop ? "dialog" : undefined}
        aria-modal={mobileOpen && !isDesktop ? true : undefined}
        aria-hidden={!isDesktop && !mobileOpen ? true : undefined}
        aria-label="Navigasi utama"
        inert={!isDesktop && !mobileOpen ? "" : undefined}
        className={cn(
          "app-sidebar",
          collapsed && "sidebar-collapsed",
          mobileOpen && "sidebar-open",
        )}
      >
        <div className="sidebar-brand">
          <Link
            to="/"
            onClick={() => select("/")}
            aria-label="SIMANTEP, Dashboard"
          >
            <img src={logo} alt="" width="34" height="34" />
            {!collapsed && (
              <span>
                simantep<span className="brand-period">.</span>
              </span>
            )}
          </Link>
          {mobileOpen && !isDesktop && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Tutup menu navigasi"
              className="icon-button"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="sidebar-body">
          <Link
            to="/arsip/tambah"
            onClick={() => select("/arsip/tambah")}
            className={cn(
              "sidebar-create",
              location.pathname === "/arsip/tambah" && "is-active",
            )}
            aria-label="Tambah arsip"
            title={collapsed ? "Tambah arsip" : undefined}
          >
            <Plus size={18} />
            {!collapsed && <span>Tambah arsip</span>}
          </Link>
          {!collapsed && <p className="sidebar-label">RUANG KERJA</p>}
          <nav aria-label="Menu utama">
            {navItems.map((item) => {
              const active =
                item.path === "/"
                  ? location.pathname === "/"
                  : item.path === "/arsip"
                    ? (location.pathname.startsWith("/arsip") &&
                        location.pathname !== "/arsip/tambah") ||
                      location.pathname === "/semua-arsip"
                    : location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => select(item.path)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn("sidebar-link", active && "is-active")}
                >
                  <item.icon size={18} aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && active && <span className="nav-active-dot" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="sidebar-bottom">
          <button
            type="button"
            onClick={onToggle}
            aria-label={
              collapsed ? "Perluas menu navigasi" : "Ringkas menu navigasi"
            }
            aria-expanded={!collapsed}
            className="sidebar-collapse"
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
            {!collapsed && <span>Ringkas navigasi</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
