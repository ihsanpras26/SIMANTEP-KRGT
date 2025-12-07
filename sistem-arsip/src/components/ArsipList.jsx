import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  FileUp,
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
  ArrowUpDown
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
import Pagination from './Pagination';
import { Modal, ModalHeader, ModalTitle, ModalContent } from './ui';
import useAppStore from '../store/useAppStore';

export default function ArsipList({
  title,
  arsipList,
  klasifikasiList,
  setEditingArsip,
  supabase,
  listType,
  setDeleteConfirmModal,
  setSelectedArsipDetail,
  initialFilter = 'all',
  showNotification
}) {
  const {
    labels,
    bulkUpdateLabelsOptimistic,
    confirmBulkUpdate,
    rollbackBulkUpdate
  } = useAppStore();

  // State
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('all');
  const [filterLabel, setFilterLabel] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('tanggalSurat');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOverflow, setFilterOverflow] = useState('hidden');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showLabelManager, setShowLabelManager] = useState(false);

  // Selection State
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkLabelModal, setShowBulkLabelModal] = useState(false);

  const filterButtonRef = useRef(null);

  // Sync filterStatus
  useEffect(() => {
    if (typeof initialFilter === 'object' && initialFilter !== null) {
      if (initialFilter.filterLabel) setFilterLabel(initialFilter.filterLabel);
      if (initialFilter.status) setFilterStatus(initialFilter.status);
    } else {
      setFilterStatus(initialFilter);
    }
  }, [initialFilter]);

  // Click outside filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilters &&
        !event.target.closest('.filter-container') &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  // Handle Escape to clear selection
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedItems.size > 0) {
        setSelectedItems(new Set());
        setIsSelectionMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems]);


  // Filter Logic
  const filteredData = useMemo(() => {
    return arsipList.filter(item => {
      const matchesSearch =
        (item.perihal?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nomorSurat?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const status = getArsipStatus(item, klasifikasiList);
      const isInactive = status === 'Inaktif';
      const matchesStatus =
        filterStatus === 'all' ? true :
          filterStatus === 'active' ? !isInactive :
            isInactive;

      const matchesKlasifikasi =
        filterKlasifikasi === 'all' ? true :
          item.kodeKlasifikasi === filterKlasifikasi;

      const matchesLabel =
        filterLabel === 'all' ? true :
          item.arsip_labels?.some(al => al.labels?.id === filterLabel);

      const matchesDate =
        !filterDate ? true :
          item.tanggalSurat.startsWith(filterDate);

      return matchesSearch && matchesStatus && matchesKlasifikasi && matchesDate && matchesLabel;
    }).sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [arsipList, searchTerm, filterStatus, filterKlasifikasi, filterDate, filterLabel, sortBy, sortOrder]);

  // Pagination Logic
  useEffect(() => {
    setCurrentPage(1);
    // Clear selection when filters change to avoid confusion
    // setSelectedItems(new Set()); 
    // setIsSelectionMode(false);
  }, [searchTerm, filterStatus, filterKlasifikasi, filterDate, filterLabel]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

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

  const handleBulkLabel = async (labelId, action) => {
    const selectedIds = Array.from(selectedItems);
    const tempId = bulkUpdateLabelsOptimistic(selectedIds, labelId, action);
    setShowBulkLabelModal(false);
    showNotification(`Label ${action === 'add' ? 'ditambahkan' : 'dihapus'} untuk ${selectedIds.length} item`);

    try {
      if (action === 'add') {
        const inserts = selectedIds.map(arsipId => ({
          arsip_id: arsipId,
          label_id: labelId
        }));
        // We need to ignore duplicates. Supabase doesn't have native "INSERT IGNORE" easy access via JS client
        // So we might face errors if duplicates exist.
        // Strategy: simple implementation, let's assume we handle duplicates gracefully or just try insert
        const { error } = await supabase.from('arsip_labels').upsert(inserts, { onConflict: 'arsip_id, label_id', ignoreDuplicates: true });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('arsip_labels')
          .delete()
          .eq('label_id', labelId)
          .in('arsip_id', selectedIds);
        if (error) throw error;
      }
      confirmBulkUpdate(tempId);
      setSelectedItems(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error('Bulk update failed:', error);
      rollbackBulkUpdate(tempId, arsipList); // This might be heavy, but accurate
      showNotification('Gagal mengupdate label', 'error');
    }
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

  const getKlasifikasiDeskripsi = (kode) => {
    // ... same code ...
    const klasifikasi = klasifikasiList.find(k => k.kode === kode);
    return klasifikasi ? klasifikasi.deskripsi : 'Tidak ada deskripsi';
  };

  return (
    <div className="space-y-6 relative">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="Cari surat berdasarkan nomor atau perihal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-white border border-neutral-200 rounded-xl text-sm shadow-sm placeholder-neutral-400
                  focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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

            <button
              onClick={() => setShowLabelManager(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
            >
              <Tag size={18} />
              <span className="hidden sm:inline font-medium">Label</span>
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <FileUp size={18} />
              <span className="hidden sm:inline font-medium">Export</span>
            </button>

            <button
              ref={filterButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all shadow-sm",
                showFilters
                  ? "bg-primary-50 border-primary-200 text-primary-700"
                  : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              )}
            >
              <Filter size={18} />
              <span className="hidden sm:inline font-medium">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Chips */}
      {(filterStatus !== 'all' || filterKlasifikasi !== 'all' || filterDate || filterLabel !== 'all') && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          {/* Same as before */}
          <span className="text-xs font-medium text-neutral-500 mr-1">Filter Aktif:</span>
          {/* ... filters ... */}
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
            <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative">
        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50/50 border-b border-neutral-100">
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
                    <th
                      className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                      onClick={() => toggleSort('nomorSurat')}
                    >
                      <div className="flex items-center gap-1">
                        Nomor Surat
                        <ArrowUpDown size={12} className="text-neutral-400" />
                      </div>
                    </th>
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Perihal</th>
                    <th
                      className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors w-48"
                      onClick={() => toggleSort('tanggalSurat')}
                    >
                      <div className="flex items-center gap-1">
                        Tanggal Surat
                        <ArrowUpDown size={12} className="text-neutral-400" />
                      </div>
                    </th>
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Kode Klasifikasi</th>
                    <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider pr-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {currentData.map((item) => {
                    const status = getArsipStatus(item, klasifikasiList);
                    const isInactive = status === 'Inaktif';
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          "group transition-colors cursor-pointer",
                          isSelected ? "bg-primary-50/50" : "hover:bg-neutral-50"
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
                        <td className="p-4" onClick={() => setSelectedArsipDetail(item)}>
                          <div className="font-medium text-neutral-900">{item.perihal}</div>
                          <div className="text-xs text-neutral-500 truncate max-w-[200px] mb-1">{item.deskripsi}</div>
                          <div className="flex flex-wrap gap-1">
                            {item.arsip_labels?.map(al => (
                              <LabelBadge key={al.label_id} label={al.labels} />
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-neutral-600">
                          {format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id })}
                        </td>
                        <td className="p-4">
                          <Tooltip content={getKlasifikasiDeskripsi(item.kodeKlasifikasi)}>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 cursor-help">
                              {item.kodeKlasifikasi}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="p-4 pr-6">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            isInactive
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isInactive ? "bg-amber-500" : "bg-emerald-500"
                            )} />
                            {isInactive ? 'Inaktif' : 'Aktif'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredData.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-neutral-400" />
                  </div>
                  <p className="text-lg font-medium text-neutral-900">Tidak ada arsip ditemukan</p>
                  <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian Anda.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {currentData.map((item) => {
              const status = getArsipStatus(item, klasifikasiList);
              const isInactive = status === 'Inaktif';
              const isSelected = selectedItems.has(item.id);
              return (
                <div
                  key={item.id}
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
                        onClick={(e) => { e.stopPropagation(); setSelectedArsipDetail(item); }}
                        className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingArsip(item); }}
                        className="p-1.5 text-neutral-400 hover:text-amber-600 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.arsip_labels?.map(al => (
                      <LabelBadge key={al.label_id} label={al.labels} />
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

                  <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar size={14} />
                      <span>{format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id })}</span>
                    </div>

                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      isInactive
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      <span className={cn(
                        "w-1 h-1 rounded-full",
                        isInactive ? "bg-amber-500" : "bg-emerald-500"
                      )} />
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
                onClick={() => setShowBulkLabelModal(true)}
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

      {/* Bulk Label Modal */}
      <Modal isOpen={showBulkLabelModal} onClose={() => setShowBulkLabelModal(false)} size="sm">
        <ModalHeader onClose={() => setShowBulkLabelModal(false)}>
          <ModalTitle>Atur Label ({selectedItems.size} Item)</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">Pilih label untuk ditambahkan ke item yang dipilih.</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {labels.map(label => (
                <div key={label.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors group">
                  <LabelBadge label={label} />
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleBulkLabel(label.id, 'add')}
                      className="p-1.5 bg-white border border-neutral-200 rounded-lg text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 text-xs font-bold shadow-sm"
                      title="Tambahkan Label"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleBulkLabel(label.id, 'remove')}
                      className="p-1.5 bg-white border border-neutral-200 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-bold shadow-sm"
                      title="Hapus Label dari Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModalContent>
      </Modal>

    </div>
  );
}
