import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  FileUp,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  Calendar,
  FileText,
  Tag,
  ChevronDown,
  ArrowUpDown,
  Grid,
  List as ListIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { cn } from '../utils/cn';
import Tooltip from './Tooltip';
import SearchableSelect from './SearchableSelect';

export default function ArsipList({
  title,
  arsipList,
  klasifikasiList,
  setEditingArsip,
  supabase,
  listType,
  setDeleteConfirmModal,
  setSelectedArsipDetail,
  initialFilter = 'all'
}) {
  // State
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter); // 'all', 'active', 'inactive'
  const [filterKlasifikasi, setFilterKlasifikasi] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('tanggalSurat'); // 'tanggalSurat', 'nomorSurat'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOverflow, setFilterOverflow] = useState('hidden');
  const filterButtonRef = useRef(null);

  // Sync filterStatus with initialFilter
  useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  // Click outside to close filters
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

  // Filter Logic
  const filteredData = useMemo(() => {
    return arsipList.filter(item => {
      const matchesSearch =
        (item.perihal?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (item.nomorSurat?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      const isInactive = item.tanggalRetensi && new Date() > new Date(item.tanggalRetensi);
      const matchesStatus =
        filterStatus === 'all' ? true :
          filterStatus === 'active' ? !isInactive :
            isInactive;

      const matchesKlasifikasi =
        filterKlasifikasi === 'all' ? true :
          item.kodeKlasifikasi === filterKlasifikasi;

      const matchesDate =
        !filterDate ? true :
          item.tanggalSurat.startsWith(filterDate);

      return matchesSearch && matchesStatus && matchesKlasifikasi && matchesDate;
    }).sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [arsipList, searchTerm, filterStatus, filterKlasifikasi, filterDate, sortBy, sortOrder]);

  // Export Logic
  const handleExport = () => {
    const dataToExport = filteredData.map(item => ({
      'Nomor Surat': item.nomorSurat,
      'Perihal': item.perihal,
      'Tanggal Surat': format(new Date(item.tanggalSurat), 'dd MMMM yyyy', { locale: id }),
      'Klasifikasi': item.kodeKlasifikasi,
      'Status': new Date() > new Date(item.tanggalRetensi) ? 'Inaktif' : 'Aktif'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arsip");
    XLSX.writeFile(wb, `Arsip_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Toggle Sort
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Helper to get classification description
  const getKlasifikasiDeskripsi = (kode) => {
    const klasifikasi = klasifikasiList.find(k => k.kode === kode);
    return klasifikasi ? klasifikasi.deskripsi : 'Tidak ada deskripsi';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                  <span className="sr-only">Clear search</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

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
      {(filterStatus !== 'all' || filterKlasifikasi !== 'all' || filterDate) && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="text-xs font-medium text-neutral-500 mr-1">Filter Aktif:</span>
          
          {filterStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium border border-neutral-200">
              Status: {filterStatus === 'active' ? 'Aktif' : 'Inaktif'}
              <button 
                onClick={() => setFilterStatus('all')}
                className="p-0.5 hover:bg-neutral-200 rounded-full transition-colors ml-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filterKlasifikasi !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium border border-neutral-200">
              Klasifikasi: {klasifikasiList.find(k => k.kode === filterKlasifikasi)?.kode || filterKlasifikasi}
              <button 
                onClick={() => setFilterKlasifikasi('all')}
                className="p-0.5 hover:bg-neutral-200 rounded-full transition-colors ml-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filterDate && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-medium border border-neutral-200">
              Tanggal: {format(new Date(filterDate), 'dd MMM yyyy', { locale: id })}
              <button 
                onClick={() => setFilterDate('')}
                className="p-0.5 hover:bg-neutral-200 rounded-full transition-colors ml-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          <button 
            onClick={() => {
              setFilterStatus('all');
              setFilterKlasifikasi('all');
              setFilterDate('');
            }}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline ml-2"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Advanced Filters */}
      <AnimatePresence
        onExitComplete={() => setFilterOverflow('hidden')}
      >
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onAnimationComplete={() => setFilterOverflow('visible')}
            className={cn("filter-container", filterOverflow === 'visible' ? 'overflow-visible' : 'overflow-hidden')}
          >
            <div className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 grid grid-cols-1 sm:grid-cols-4 gap-5">
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
                  placeholder="Cari kode atau deskripsi..."
                  options={klasifikasiList.map(k => ({
                    value: k.kode,
                    label: `${k.kode} - ${k.deskripsi}`
                  }))}
                  value={filterKlasifikasi}
                  onChange={setFilterKlasifikasi}
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

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                  <th
                    className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors pl-6"
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
                {filteredData.map((item) => {
                  const isInactive = item.tanggalRetensi && new Date() > new Date(item.tanggalRetensi);
                  return (
                    <tr
                      key={item.id}
                      className="group hover:bg-neutral-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedArsipDetail(item)}
                    >
                      <td className="p-4 font-mono text-sm text-neutral-600 pl-6">{item.nomorSurat}</td>
                      <td className="p-4">
                        <div className="font-medium text-neutral-900">{item.perihal}</div>
                        <div className="text-xs text-neutral-500 truncate max-w-[200px]">{item.deskripsi}</div>
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
          {filteredData.map((item) => {
            const isInactive = item.tanggalRetensi && new Date() > new Date(item.tanggalRetensi);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-neutral-200 p-5 hover:shadow-md transition-all group relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <Tooltip content={getKlasifikasiDeskripsi(item.kodeKlasifikasi)}>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 cursor-help">
                      {item.kodeKlasifikasi}
                    </span>
                  </Tooltip>
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

                <h3
                  className="font-bold text-neutral-900 mb-1 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
                  title={item.perihal}
                  onClick={() => setSelectedArsipDetail(item)}
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
  );
}
