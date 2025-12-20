import React, { useState, useMemo } from 'react';
import Tooltip from '../components/Tooltip';
import AnimatedStatCard from '../components/AnimatedStatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  FileText,
  CheckCircle,
  Clock,
  Archive,
  TrendingUp,
  TrendingDown,
  Activity,
  FolderOpen,
  ArchiveRestore,
  FileCheck,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard({
  stats,
  trends,
  activeArchives,
  inactiveArchives,
  archivesByYear,
  navigate,
  setEditingArsip,
  setSelectedArsipDetail
}) {
  const [chartFilter, setChartFilter] = useState('5 Tahun Terakhir');

  // Compute chart data based on filter
  const chartData = useMemo(() => {
    if (chartFilter === 'Tahun Ini') {
      const currentYear = new Date().getFullYear();
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      // Initialize monthly data
      const monthlyData = months.map(m => ({ name: m, Aktif: 0, Inaktif: 0 }));

      // Helper to process archives
      const processArchives = (list, type) => {
        list.forEach(arsip => {
          const date = new Date(arsip.tanggalSurat);
          if (date.getFullYear() === currentYear) {
            monthlyData[date.getMonth()][type]++;
          }
        });
      };

      processArchives(activeArchives, 'Aktif');
      processArchives(inactiveArchives, 'Inaktif');

      return monthlyData;
    } else {
      // 5 Tahun Terakhir
      const currentYear = new Date().getFullYear();
      return archivesByYear.filter(d => d.name >= currentYear - 4);
    }
  }, [chartFilter, activeArchives, inactiveArchives, archivesByYear]);

  const formatTrend = (value) => {
    const val = value || 0;
    return val > 0 ? `+${val}%` : `${val}%`;
  };

  const getTrendStyle = (value) => {
    const val = value || 0;
    if (val > 0) return 'text-emerald-600 bg-emerald-50';
    if (val < 0) return 'text-red-600 bg-red-50';
    return 'text-neutral-600 bg-neutral-100';
  };

  const getTrendIcon = (value) => {
    return (value || 0) >= 0 ? TrendingUp : TrendingDown;
  };

  const statCards = [
    {
      title: 'Total Arsip',
      value: stats.total,
      icon: Archive,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: formatTrend(trends?.total),
      trendStyle: getTrendStyle(trends?.total),
      TrendIcon: getTrendIcon(trends?.total),
      onClick: () => navigate('semua', 'all')
    },
    {
      title: 'Arsip Aktif',
      value: stats.active,
      icon: FileCheck,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      trend: formatTrend(trends?.active),
      trendStyle: getTrendStyle(trends?.active),
      TrendIcon: getTrendIcon(trends?.active),
      onClick: () => navigate('arsip', 'active')
    },
    {
      title: 'Arsip Inaktif',
      value: stats.inactive,
      icon: ArchiveRestore,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      trend: formatTrend(trends?.inactive),
      trendStyle: getTrendStyle(trends?.inactive),
      TrendIcon: getTrendIcon(trends?.inactive),
      onClick: () => navigate('semua', 'inactive')
    },
  ];

  // Combine and sort recent archives by tanggalSurat
  const recentArchives = useMemo(() => {
    const all = [...activeArchives, ...inactiveArchives];
    return all.sort((a, b) => new Date(b.tanggalSurat) - new Date(a.tanggalSurat)).slice(0, 5);
  }, [activeArchives, inactiveArchives]);

  return (
    <div className="space-y-8">
      {/* Stats Grid with Animated Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <AnimatedStatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            bgColor={stat.bgColor}
            textColor={stat.textColor}
            trend={stat.trend}
            trendStyle={stat.trendStyle}
            TrendIcon={stat.TrendIcon}
            onClick={stat.onClick}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-card border border-neutral-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-neutral-900">
              {chartFilter === 'Tahun Ini' ? 'Volume Arsip Bulanan (Tahun Ini)' : 'Volume Arsip per Tahun'}
            </h3>
            <select
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="text-sm border-none bg-neutral-50 rounded-lg px-3 py-1 text-neutral-600 focus:ring-0 cursor-pointer hover:bg-neutral-100 transition-colors"
            >
              <option>Tahun Ini</option>
              <option>5 Tahun Terakhir</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAktif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInaktif" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area
                  type="monotone"
                  dataKey="Aktif"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorAktif)"
                  animationDuration={1500}
                />
                <Area
                  type="monotone"
                  dataKey="Inaktif"
                  stroke="#94a3b8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorInaktif)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Archives */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-card border border-neutral-100 flex flex-col"
        >
          <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary-500" />
            Arsip Terbaru
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {recentArchives.map((item, i) => (
              <div
                key={item.id}
                className="flex gap-3 group cursor-pointer p-2 rounded-xl hover:bg-neutral-50 transition-all"
                onClick={() => setSelectedArsipDetail(item)}
              >
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 group-hover:scale-110 transition-all">
                    <FileText size={18} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <Tooltip content={item.perihal} className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                      {item.perihal}
                    </p>
                  </Tooltip>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {item.nomorArsip}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {format(new Date(item.tanggalSurat || new Date()), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {recentArchives.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                <Archive size={32} className="mb-2 opacity-20" />
                <p className="text-sm">Belum ada arsip</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('arsip')}
            className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Lihat Semua Arsip
            <TrendingUp size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
