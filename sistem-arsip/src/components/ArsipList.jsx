import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
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
  const [sortBy, setSortBy] = useState('tanggalSurat'); // 'tanggalSurat', 'nomorSurat'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sync filterStatus with initialFilter
  useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  // Click outside to close filters
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.filter-container')) {
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
        item.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase());

      const isInactive = item.tanggalRetensi && new Date() > new Date(item.tanggalRetensi);
      const matchesStatus =
        filterStatus === 'all' ? true :
          filterStatus === 'active' ? !isInactive :
            isInactive;

      const matchesKlasifikasi =
        filterKlasifikasi === 'all' ? true :
          item.kodeKlasifikasi === filterKlasifikasi;

      return matchesSearch && matchesStatus && matchesKlasifikasi;
    }).sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      return sortOrder === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
  }, [arsipList, searchTerm, filterStatus, filterKlasifikasi, sortBy, sortOrder]);

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

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-card border border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="relative group flex items-center bg-neutral-50 border border-neutral-200 rounded-lg w-64 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
            <Search className="absolute left-3 text-neutral-400 group-focus-within:text-primary-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Cari surat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ outline: 'none', boxShadow: 'none' }}
              className="pl-10 pr-4 py-2 bg-transparent border-none outline-none focus:outline-none ring-0 focus:ring-0 appearance-none w-full text-sm"
            />
          </div>
          <div className="relative filter-container">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-lg border transition-colors",
                showFilters ? "bg-primary-50 border-primary-200 text-primary-600" : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              )}
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'table' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === 'grid' ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Grid size={18} />
            </button>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden filter-container"
          >
            <div className="bg-white p-4 rounded-xl shadow-card border border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Status Arsip</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Inaktif</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Klasifikasi</label>
                <select
                  value={filterKlasifikasi}
                  onChange={(e) => setFilterKlasifikasi(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
                >
                  <option value="all">Semua Klasifikasi</option>
                  {klasifikasiList.map(k => (
                    <option key={k.id} value={k.kode}>{k.kode} - {k.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-500 mb-1 block">Urutkan</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm"
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
        <div className="bg-white rounded-xl shadow-card border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
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
                    className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => toggleSort('tanggalSurat')}
                  >
                    <div className="flex items-center gap-1">
                      Tanggal
                      <ArrowUpDown size={12} className="text-neutral-400" />
                    </div>
                  </th>
                  <th className="p-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Klasifikasi</th>
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
                        {format(new Date(item.tanggalSurat), 'dd MMM yyyy', { locale: id })}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                          {item.kodeKlasifikasi}
                        </span>
                      </td>
                      <td className="p-4 pr-6">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          isInactive
                            ? "bg-neutral-100 text-neutral-600 border-neutral-200"
                            : "bg-success-50 text-success-700 border-success-100"
                        )}>
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
                <FileText size={48} className="mx-auto mb-4 text-neutral-300" />
                <p className="text-lg font-medium">Tidak ada arsip ditemukan</p>
                <p className="text-sm">Coba ubah filter atau kata kunci pencarian Anda.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredData.map((item) => {
            const isInactive = item.tanggalRetensi && new Date() > new Date(item.tanggalRetensi);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-card border border-neutral-100 p-5 hover:shadow-soft transition-shadow group relative">
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100">
                    {item.kodeKlasifikasi}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedArsipDetail(item)}
                      className="p-1.5 text-neutral-400 hover:text-primary-600 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingArsip(item)}
                      className="p-1.5 text-neutral-400 hover:text-warning-600 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-neutral-900 mb-1 line-clamp-2" title={item.perihal}>{item.perihal}</h3>
                <p className="font-mono text-xs text-neutral-500 mb-4">{item.nomorSurat}</p>

                <div className="flex items-center gap-2 text-xs text-neutral-500 mb-4">
                  <Calendar size={14} />
                  <span>{format(new Date(item.tanggalSurat), 'dd MMM yyyy', { locale: id })}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                  <span className={cn(
                    "text-xs font-medium",
                    isInactive ? "text-neutral-500" : "text-success-600"
                  )}>
                    {isInactive ? 'Inaktif' : 'Aktif'}
                  </span>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    >
                      <Download size={12} />
                      Download
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
