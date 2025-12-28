import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Tag,
  Grid,
  List as ListIcon,
  Eye,
  Edit,
  Calendar,
  X,
  Check,
  MoreHorizontal,
  Trash2,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { cn } from '../utils/cn';
import Tooltip from './Tooltip';
import SearchableSelect from './SearchableSelect';
import { getArsipStatus } from '../utils/statusUtils';
import LabelManager from './LabelManager';
import LabelBadge from './LabelBadge';
import StatusBadge from './StatusBadge';
import BulkImportModal from './BulkImportModal';
import LabelAssignmentModal from './LabelAssignmentModal';
import ContextMenu from './ContextMenu';
import RowActionsMenu from './RowActionsMenu';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalContent, Button } from './ui';
import useAppStore from '../store/useAppStore';
import { useArsip } from '../hooks/useArsip';
import { useKlasifikasi } from '../hooks/useKlasifikasi';
import SkeletonArsipList from './SkeletonArsipList';

export default function ArsipList({
  title,
  setEditingArsip,
  supabase,
  listType,
  setDeleteConfirmModal,
  setSelectedArsipDetail,
  initialFilter = 'all',
  showNotification
}) {
  // State for Pagination & Filters
  const [viewMode, setViewMode] = useState('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('all');
  const [filterLabel, setFilterLabel] = useState('all');
  const [sortBy, setSortBy] = useState('tanggalSurat');
  const [sortOrder, setSortOrder] = useState('desc');

  // Restored States
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOverflow, setFilterOverflow] = useState('hidden');
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [labelAssignmentTarget, setLabelAssignmentTarget] = useState(null);
  const [showLabelAssignmentModal, setShowLabelAssignmentModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportMode, setBulkImportMode] = useState('create'); // 'create' | 'update'
  const filterButtonRef = useRef(null);

  // Read label filter from URL params
  const [searchParams] = useSearchParams();
  const labelFromUrl = searchParams.get('label');

  // Initialize filterLabel from URL on mount
  useEffect(() => {
    if (labelFromUrl) {
      setFilterLabel(labelFromUrl);
    }
  }, [labelFromUrl]);

  // React Query Hooks (Server-side Pagination)
  const { data: arsipQueryData, isLoading: arsipLoading, isPlaceholderData, refetch } = useArsip({
    page: currentPage,
    pageSize: itemsPerPage,
    searchTerm,
    filterKlasifikasi,
    filterLabel,
    sortBy,
    sortOrder
  });
  const { data: klasifikasiData, isLoading: klasifikasiLoading } = useKlasifikasi();

  const arsipList = arsipQueryData?.data || [];
  const totalItems = arsipQueryData?.count || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const klasifikasiList = klasifikasiData || [];
  const {
    labels,
    bulkUpdateLabelsOptimistic,
    confirmBulkUpdate,
    rollbackBulkUpdate
  } = useAppStore();

  // Debounce Search
  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [searchTerm, filterKlasifikasi, filterLabel]);

  // Using `arsipList` directly as it is now the "Page Data".
  const filteredData = arsipList; // The hook already filtered it!

  // Context Menu State
  const [contextMenu, setContextMenu] = useState(null); // { x, y, targetItems }

  useEffect(() => {
    // Close context menu on any click
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);



  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicked item is part of selection, treat as "Action on Selection"
    // If NOT part of selection, select ONLY this item and treat as "Action on Single Item"
    let targets = null;
    if (selectedItems.has(item.id)) {
      targets = currentData.filter(i => selectedItems.has(i.id));
    } else {
      // Clear selection and select this one (visually safer for user)
      // Or just act on this one without changing selection? Standard explorer behavior: select this one.
      setSelectedItems(new Set([item.id]));
      setIsSelectionMode(true); // Wait, if we want right click to select, we should update selection state.
      targets = [item];
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetItems: targets
    });
  };



  // Pagination Logic - Handled by Query
  // const startIndex = (currentPage - 1) * itemsPerPage; // Already handled by SQL
  const startIndex = (currentPage - 1) * itemsPerPage; // Defined for display info only if needed, but Query handles limits.
  // Wait, I need startIndex for the "Showing 1-10 of 100" text in Pagination component.
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const currentData = arsipList; // The API returns 1 page only

  // Selection Handlers
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
    setIsSelectionMode(newSelection.size > 0);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === currentData.length) {
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } else {
      const newSelection = new Set(currentData.map(item => item.id));
      setSelectedItems(newSelection);
      setIsSelectionMode(true);
    }
  };

  const handleOpenBulkLabel = () => {
    const targets = currentData.filter(item => selectedItems.has(item.id));
    setLabelAssignmentTarget(targets);
    setShowLabelAssignmentModal(true);
  };





  // Export Logic
  const handleExport = () => {
    // ... same code ...
    const dataToExport = filteredData.map(item => ({
      'Nomor Surat': item.nomorSurat,
      'Perihal': item.perihal,
      'Tanggal Surat': format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id }),
      'Klasifikasi': item.kodeKlasifikasi,
      'Status': getArsipStatus(item, klasifikasiList),
      'Labels': item.arsip_labels?.map(l => l.labels?.name).join(', ') || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arsip");
    XLSX.writeFile(wb, `Arsip_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    const isActive = sortBy === field;
    if (!isActive) return <ArrowUpDown size={12} className="text-neutral-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortOrder === 'asc'
      ? <ArrowUp size={12} className="text-primary-600" />
      : <ArrowDown size={12} className="text-primary-600" />;
  };

  const getKlasifikasiDeskripsi = (kode) => {
    // ... same code ...
    const klasifikasi = klasifikasiList.find(k => k.kode === kode);
    return klasifikasi ? klasifikasi.deskripsi : 'Tidak ada deskripsi';
  };

  const handleManageLabels = (item) => {
    setLabelAssignmentTarget(item);
    setShowLabelAssignmentModal(true);
  };

  return (
    <div className="space-y-5 relative">
      {/* Enhanced Header with Primary CTA */}
      <div className="flex flex-col gap-5">
        {/* Top Row: Search + Primary CTA */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          {/* Enhanced Search - More Prominent */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="text-neutral-400 group-focus-within:text-primary-600 transition-colors" size={22} />
              </div>
              <input
                type="text"
                placeholder="Cari berdasarkan nomor, perihal, atau pengirim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-12 py-4 bg-white border-2 border-neutral-200 rounded-xl text-base shadow-sm placeholder-neutral-400
                  focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Primary CTA Button */}
          <Button
            size="lg"
            onClick={() => setEditingArsip(null)}
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tambah Arsip</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>

        {/* Action Buttons - Reorganized by Function */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Group 1: View Mode */}
          <div className="flex bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'table' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Grid size={18} />
            </button>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-neutral-200"></div>

          {/* Group 2: Data Actions */}
          <button
            onClick={() => {
              setBulkImportMode('create');
              setShowBulkImport(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all shadow-sm font-medium"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={() => {
              setBulkImportMode('update');
              setShowBulkImport(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all shadow-sm font-medium"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Edit Massal</span>
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all shadow-sm font-medium"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Divider */}
          <div className="h-8 w-px bg-neutral-200"></div>

          {/* Group 3: Organization & Filters */}
          <button
            onClick={() => {
              const newMode = !isSelectionMode;
              setIsSelectionMode(newMode);
              if (!newMode) setSelectedItems(new Set());
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all shadow-sm font-medium",
              isSelectionMode && "bg-primary-50 border-primary-500 text-primary-700"
            )}
          >
            <Tag size={18} />
            <span className="hidden sm:inline">Label</span>
          </button>

          <button
            ref={filterButtonRef}
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-all shadow-sm font-medium",
              showFilters && "bg-primary-50 border-primary-500 text-primary-700"
            )}
          >
            <Filter size={18} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Active Filters Chips */}
      {(filterStatus !== 'all' || filterKlasifikasi !== 'all' || filterDate || filterLabel !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs font-medium text-neutral-500 mr-1">Filter Aktif:</span>
          {filterStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
              Status: {filterStatus === 'active' ? 'Aktif' : 'Tidak Aktif'}
              <button onClick={() => setFilterStatus('all')} className="hover:bg-primary-100 rounded-full p-0.5">
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setFilterStatus('all');
              setFilterKlasifikasi('all');
              setFilterDate('');
              setFilterLabel('all');
            }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline ml-2"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <AnimatePresence onExitComplete={() => setFilterOverflow('hidden')}>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onAnimationComplete={() => setFilterOverflow('visible')}
            className={cn("filter-container", filterOverflow === 'visible' ? 'overflow-visible' : 'overflow-hidden')}
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-2">
                  <Filter size={16} />
                  Filter & Urutkan
                </h3>
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterKlasifikasi('all');
                    setFilterDate('');
                    setFilterLabel('all');
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                >
                  Reset Semua
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* ... Filters Inputs ... */}
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Status Arsip</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Inaktif</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Tanggal Surat</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Kode Klasifikasi"
                    placeholder="Cari kode..."
                    options={klasifikasiList.map(k => ({
                      value: k.kode,
                      label: `${k.kode} - ${k.deskripsi}`
                    }))}
                    value={filterKlasifikasi}
                    onChange={setFilterKlasifikasi}
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Label"
                    placeholder="Cari label..."
                    options={labels.map(l => ({
                      value: l.id,
                      label: l.name
                    }))}
                    value={filterLabel}
                    onChange={setFilterLabel}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 block">Urutkan</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="tanggalSurat">Tanggal Surat</option>
                    <option value="nomorSurat">Nomor Surat</option>
                    <option value="created_at">Tanggal Input</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative">
        {arsipLoading ? (
          <SkeletonArsipList viewMode={viewMode} />
        ) : currentData.length === 0 ? (
          <EmptyState
            type={searchTerm || filterKlasifikasi !== 'all' || filterLabel !== 'all' ? 'noResults' : 'noData'}
            searchTerm={searchTerm}
            activeFilters={
              (filterKlasifikasi !== 'all' ? 1 : 0) +
              (filterLabel !== 'all' ? 1 : 0) +
              (filterDate ? 1 : 0) +
              (filterStatus !== 'all' ? 1 : 0)
            }
            onAction={() => {
              if (searchTerm || filterKlasifikasi !== 'all' || filterLabel !== 'all') {
                setSearchTerm('');
                setFilterKlasifikasi('all');
                setFilterLabel('all');
                setFilterDate('');
                setFilterStatus('all');
              } else {
                setEditingArsip({});
              }
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-neutral-50 to-neutral-50/50 border-b-2 border-neutral-200">
                    {isSelectionMode && (
                      <th className="w-12 p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === currentData.length && currentData.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </th>
                    )}
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Nomor Surat
                    </th>
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Perihal</th>
                    <th
                      className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider group cursor-pointer hover:bg-neutral-100 transition-colors w-48"
                      onClick={() => toggleSort('tanggalSurat')}
                    >
                      <div className="flex items-center gap-1">
                        Tanggal Surat
                        <SortIcon field="tanggalSurat" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-bold text-neutral-600 uppercase tracking-wider group cursor-pointer hover:bg-neutral-100"
                      onClick={() => toggleSort('kodeKlasifikasi')}
                    >
                      <div className="flex items-center gap-1">
                        Kode Klasifikasi
                        <SortIcon field="kodeKlasifikasi" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-bold text-neutral-600 uppercase tracking-wider group cursor-pointer hover:bg-neutral-100"
                      onClick={() => toggleSort('label')}
                    >
                      <div className="flex items-center gap-1">
                        Label
                        <SortIcon field="label" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-4 text-xs font-bold text-neutral-600 uppercase tracking-wider group cursor-pointer hover:bg-neutral-100"
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-neutral-600 uppercase tracking-wider text-center w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((item) => {
                    const status = getArsipStatus(item, klasifikasiList);
                    const isInactive = status === 'Inaktif';
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        className={cn(
                          "group transition-all cursor-pointer border-b border-neutral-100 last:border-b-0",
                          isSelected
                            ? "bg-primary-50/50"
                            : "hover:bg-neutral-50 hover:shadow-sm"
                        )}
                        onClick={() => setSelectedArsipDetail(item)}
                      >
                        {isSelectionMode && (
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(item.id)}
                              className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td className="p-4 font-mono text-sm text-neutral-600">{item.nomorSurat}</td>
                        <td className="px-6 py-5">
                          <span className="font-semibold text-neutral-900 line-clamp-2">
                            {item.perihal}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-neutral-600">
                          {format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id })}
                        </td>
                        <td className="px-6 py-5">
                          <Tooltip content={getKlasifikasiDeskripsi(item.kodeKlasifikasi)}>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 cursor-help">
                              {item.kodeKlasifikasi}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-1 items-center max-w-xs">
                            {item.arsip_labels && item.arsip_labels.length > 0 ? (
                              item.arsip_labels.map((al, idx) => (
                                <LabelBadge key={`${al.label_id}-${idx}`} label={al.labels} size="sm" />
                              ))
                            ) : (
                              <span className="text-xs text-neutral-400 italic">Tanpa label</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <StatusBadge status={isInactive ? 'inactive' : 'active'} />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <RowActionsMenu
                            item={item}
                            onView={setSelectedArsipDetail}
                            onEdit={setEditingArsip}
                            onManageLabels={handleManageLabels}
                            onDelete={(item) => {
                              setDeleteConfirmModal({ show: true, arsipId: item.id });
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-fade-in">
            {currentData.map((item) => {
              const status = getArsipStatus(item, klasifikasiList);
              const isInactive = status === 'Inaktif';
              const isSelected = selectedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={cn(
                    "bg-white rounded-xl shadow-sm border p-5 transition-all group relative flex flex-col h-full",
                    isSelected ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50/10" : "border-neutral-200 hover:shadow-md"
                  )}
                  onClick={() => setSelectedArsipDetail(item)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(item.id);
                          }}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      )}
                      <Tooltip content={getKlasifikasiDeskripsi(item.kodeKlasifikasi)}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 cursor-help">
                          {item.kodeKlasifikasi}
                        </span>
                      </Tooltip>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleManageLabels(item); }}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg transition-colors bg-white shadow-sm border border-neutral-100"
                        title="Kelola Label"
                      >
                        <Tag size={16} />
                      </button>
                      <button
                        onClick={() => { e.stopPropagation(); setSelectedArsipDetail(item); }}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg transition-colors bg-white shadow-sm border border-neutral-100"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { e.stopPropagation(); setEditingArsip(item); }}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg transition-colors bg-white shadow-sm border border-neutral-100"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.arsip_labels?.map((al, idx) => (
                      <LabelBadge key={`${al.label_id}-${idx}`} label={al.labels} />
                    ))}
                  </div>

                  <h3
                    className="font-bold text-neutral-900 mb-1 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
                    title={item.perihal}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedArsipDetail(item);
                    }}
                  >
                    {item.perihal}
                  </h3>
                  <p className="font-mono text-xs text-neutral-500 mb-4">{item.nomorSurat}</p>

                  <div className="mt-auto flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span>{format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id })}</span>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium border",
                      isInactive
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {isInactive ? 'Inaktif' : 'Aktif'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Pagination Footer - Keep as is (omitted for brevity, assume its there or reused) */}
      {/* Pagination Footer */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredData.length}
        startIndex={startIndex}
        endIndex={endIndex}
      />

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {isSelectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-6"
          >
            <div className="flex items-center gap-3 border-r border-neutral-700 pr-6">
              <div className="px-2 py-0.5 bg-neutral-800 rounded text-xs font-mono font-bold">
                {selectedItems.size}
              </div>
              <span className="text-sm font-medium">Terpilih</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenBulkLabel}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 rounded-lg text-sm font-bold transition-colors"
              >
                <Tag size={16} />
                Label
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
                title="Batal Pilih"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal
          isOpen={true}
          onClose={() => {
            setShowBulkImport(false);
            setBulkImportMode('create'); // Reset to default
          }}
          onSuccess={() => {
            // Refresh data
            refetch();
          }}
          mode={bulkImportMode}
          supabase={supabase}
        />
      )}

      <Modal isOpen={showLabelManager} onClose={() => setShowLabelManager(false)} size="lg">
        <ModalHeader onClose={() => setShowLabelManager(false)}>
          <ModalTitle>Kelola Label</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <LabelManager
            supabase={supabase}
            onClose={() => setShowLabelManager(false)}
            showNotification={showNotification}
          />
        </ModalContent>
      </Modal>

      {/* Bulk Label Modal (Unified) */}
      <Modal isOpen={showLabelAssignmentModal} onClose={() => setShowLabelAssignmentModal(false)} size="sm">
        <ModalHeader onClose={() => setShowLabelAssignmentModal(false)}>
          <ModalTitle>
            {Array.isArray(labelAssignmentTarget)
              ? `Pilih Label (${labelAssignmentTarget.length} Item)`
              : 'Pilih Label'}
          </ModalTitle>
        </ModalHeader>
        <ModalContent>
          <LabelAssignmentModal
            targetArsips={labelAssignmentTarget}
            onClose={() => setShowLabelAssignmentModal(false)}
            showNotification={showNotification}
          />
        </ModalContent>
      </Modal>



      {/* Context Menu */}
      {
        contextMenu && (
          <ContextMenu
            position={{ x: contextMenu.x, y: contextMenu.y }}
            targetItems={contextMenu.targetItems}
            onClose={() => setContextMenu(null)}
            onManageLabels={() => {
              setLabelAssignmentTarget(contextMenu.targetItems);
              setShowLabelAssignmentModal(true);
            }}
            onDelete={() => {
              console.log('Delete requested');
            }}
            onViewDetail={() => {
              if (contextMenu.targetItems.length === 1) {
                setSelectedArsipDetail(contextMenu.targetItems[0]);
              }
            }}
          />
        )
      }



    </div >
  );
}
