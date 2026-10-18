import { useState, useEffect, useRef, useMemo, useId } from "react";
import {
  Search,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  FileText,
  FolderKanban,
  Plus,
  LayoutDashboard,
  Tag,
  X,
  LoaderCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useArsip } from "../../features/arsip/hooks/useArsip";
import { Modal } from "../ui/Modal";

const EMPTY_ACTIONS = [];

export default function CommandPalette({
  isOpen,
  onClose,
  actions = EMPTY_ACTIONS,
  setSelectedArsipDetail,
  onNavigate,
}) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listId = useId();
  const navigate = useNavigate();
  const result = useArsip(
    { searchTerm, page: 1, pageSize: 10 },
    { enabled: isOpen && searchTerm.trim().length > 0 },
  );
  const pendingDebounce = query.trim() !== searchTerm;
  const searching =
    Boolean(query.trim()) && (pendingDebounce || result.isFetching);
  const archives =
    !pendingDebounce &&
    !result.isPlaceholderData &&
    !result.isError &&
    searchTerm
      ? result.data?.data || []
      : [];

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSearchTerm("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const defaultActions = useMemo(() => {
    const go = (path) => {
      onNavigate?.(path);
      navigate(path);
    };
    return [
      {
        id: "new",
        label: "Tambah arsip",
        description: "Simpan dokumen baru",
        icon: Plus,
        action: () => go("/arsip/tambah"),
      },
      {
        id: "dashboard",
        label: "Dashboard",
        description: "Gambaran seluruh arsip",
        icon: LayoutDashboard,
        action: () => go("/"),
      },
      {
        id: "archives",
        label: "Daftar arsip",
        description: "Telusuri koleksi dokumen",
        icon: FileText,
        action: () => go("/arsip"),
      },
      {
        id: "labels",
        label: "Label & kategori",
        description: "Atur kelompok dokumen",
        icon: Tag,
        action: () => go("/label"),
      },
      {
        id: "classification",
        label: "Klasifikasi",
        description: "Kelola kode dan retensi",
        icon: FolderKanban,
        action: () => go("/klasifikasi"),
      },
    ];
  }, [navigate, onNavigate]);
  const items = [...defaultActions, ...actions].filter(
    (item) =>
      !query.trim() ||
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  archives.forEach((archive) =>
    items.push({
      id: `archive-${archive.id}`,
      label: archive.perihal || "Tanpa perihal",
      description: archive.nomorSurat || "Tanpa nomor surat",
      icon: FileText,
      action: () => {
        if (setSelectedArsipDetail) setSelectedArsipDetail(archive);
        else navigate(`/arsip/${encodeURIComponent(archive.id)}`);
      },
    }),
  );
  const activeIndex = Math.min(selectedIndex, items.length - 1);
  const activeId =
    activeIndex >= 0 ? `${listId}-${items[activeIndex].id}` : undefined;

  useEffect(() => {
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeId]);
  const execute = (item) => {
    onClose();
    item.action();
  };
  const handleKey = (event) => {
    if (
      (event.key === "ArrowDown" || event.key === "ArrowUp") &&
      items.length
    ) {
      event.preventDefault();
      setSelectedIndex(
        (value) =>
          (Math.min(value, items.length - 1) +
            (event.key === "ArrowDown" ? 1 : -1) +
            items.length) %
          items.length,
      );
    } else if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      execute(items[activeIndex]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="command-dialog"
      aria-label="Pencarian cepat"
      initialFocusRef={inputRef}
    >
      <div className="command-search">
        <Search size={21} aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKey}
          role="combobox"
          aria-label="Cari arsip atau halaman"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={activeId}
          autoComplete="off"
          placeholder="Cari arsip atau buka halaman..."
        />
        <button
          type="button"
          onClick={onClose}
          className="icon-button"
          aria-label="Tutup pencarian"
        >
          <X size={18} />
        </button>
      </div>
      <div className="command-results" ref={listRef}>
        <div className="command-section-label">
          {query.trim() ? "HASIL PENCARIAN" : "AKSES CEPAT"}
          {searching && (
            <LoaderCircle
              size={14}
              className="loading-spinner"
              aria-label="Mencari"
            />
          )}
        </div>
        <div id={listId} role="listbox" aria-label="Hasil pencarian">
          {items.map((item, index) => (
            <button
              id={`${listId}-${item.id}`}
              key={item.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
              className="command-option"
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => execute(item)}
            >
              <span className="command-option-icon">
                <item.icon size={19} />
              </span>
              <span className="command-option-copy">
                <span>{item.label}</span>
                <small>{item.description || item.subLabel}</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
        {!items.length && !searching && !result.isError && (
          <div className="empty-state">
            <Search size={24} />
            <p>Tidak ada hasil untuk “{query}”.</p>
            <span>Coba nomor surat atau kata lain pada perihal.</span>
          </div>
        )}
        {result.isError && searchTerm && !pendingDebounce && (
          <div className="command-error" role="alert">
            Arsip belum dapat dimuat.
            <button
              type="button"
              className="btn-ghost"
              onClick={() => result.refetch()}
            >
              Coba lagi
            </button>
          </div>
        )}
        <span className="sr-only" role="status">
          {searching ? "Mencari arsip" : `${items.length} hasil tersedia`}
        </span>
      </div>
      <div className="command-footer">
        <span>
          <ArrowUp size={12} />
          <ArrowDown size={12} /> pilih
        </span>
        <span>
          <CornerDownLeft size={12} /> buka
        </span>
        <span>
          <kbd>esc</kbd> tutup
        </span>
      </div>
    </Modal>
  );
}
