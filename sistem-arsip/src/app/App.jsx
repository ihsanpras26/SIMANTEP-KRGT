import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useAppStore from '../stores/useAppStore';
import { getArsipStatus } from '../features/arsip/utils/statusUtils';
import { supabase } from '../lib/supabaseClient';
import { useArsip, ARSIP_KEYS } from '../features/arsip/hooks/useArsip';
import { useKlasifikasi } from '../features/klasifikasi/hooks/useKlasifikasi';
import { useLabels } from '../features/labels/hooks/useLabels';

// Layout & Components
import Layout from '../components/layout/Layout';
import ArsipForm from '../features/arsip/components/ArsipForm';
import KlasifikasiManager from '../features/klasifikasi/components/KlasifikasiManager';
import ArsipList from '../features/arsip/components/ArsipList';
import Dashboard from '../features/dashboard/pages/Dashboard';
import AdminLoginForm from '../features/auth/components/AdminLoginForm';
import ConfigurationMessage from '../features/auth/components/ConfigurationMessage';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import InfoModal from '../components/shared/InfoModal';
import ArsipDetailPage from '../features/arsip/pages/ArsipDetailPage';
import { getArsipReturnPath } from '../features/arsip/utils/listState';
import DeleteConfirmModal from '../components/shared/DeleteConfirmModal';
import KlasifikasiForm from '../features/klasifikasi/components/KlasifikasiForm';
import LabelDashboard from '../features/labels/components/LabelDashboard';
import { Modal, ModalHeader, ModalTitle, ModalContent, Button } from '../components/ui';

// Styles
import '../styles/animations.css';

// Assets
import logo from '../assets/favicon.svg';
import img1 from '../assets/krgt (1).jpeg';
import img2 from '../assets/krgt (2).jpeg';
import img3 from '../assets/krgt (3).jpeg';
import img4 from '../assets/krgt (4).jpeg';
import img5 from '../assets/krgt (5).jpeg';
import img6 from '../assets/krgt (6).jpeg';
import img7 from '../assets/krgt (7).jpeg';
import img8 from '../assets/krgt (8).jpeg';
import img9 from '../assets/krgt (9).jpeg';
import img10 from '../assets/krgt (10).jpeg';
import img11 from '../assets/krgt (11).jpeg';
import img12 from '../assets/krgt (12).jpeg';

const backgroundImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12];


export default function App() {
    // --- State Management ---
    // const [currentView, setCurrentView] = useState('dashboard'); // Removed for Router
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [session, setSession] = useState(null);

    // Zustand store
    const {
        arsipList,
        klasifikasiList,
        isLoading: storeLoading,
        setArsipList,
        setKlasifikasiList,
        setLabels,
        setIsLoading: setStoreLoading
    } = useAppStore();

    // Dashboard and command search share a complete, cached archive collection.
    const arsipQuery = useArsip({ page: 'all' });
    const klasifikasiQuery = useKlasifikasi();
    const labelsQuery = useLabels();
    const { data: arsipData, isLoading: arsipLoading } = arsipQuery;
    const { data: klasifikasiData, isLoading: klasifikasiLoading } = klasifikasiQuery;
    const { data: labelsData, isLoading: labelsLoading } = labelsQuery;
    const dashboardError = arsipQuery.error || klasifikasiQuery.error || labelsQuery.error;

    // Sync Query Data to Store (Bridge for Transition)
    useEffect(() => {
        if (arsipData?.data) setArsipList(arsipData.data);
    }, [arsipData, setArsipList]);

    useEffect(() => {
        if (klasifikasiData) setKlasifikasiList(klasifikasiData);
    }, [klasifikasiData, setKlasifikasiList]);

    useEffect(() => {
        if (labelsData) setLabels(labelsData);
    }, [labelsData, setLabels]);

    useEffect(() => {
        setStoreLoading(arsipLoading || klasifikasiLoading || labelsLoading);
    }, [arsipLoading, klasifikasiLoading, labelsLoading, setStoreLoading]);

    // Modal & Edit States
    const [editingArsip, setEditingArsip] = useState(null);
    const [editingKlasifikasi, setEditingKlasifikasi] = useState(null);
    const [showKlasifikasiModal, setShowKlasifikasiModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, id: null, message: '' });

    // Admin Auth
    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || '';
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

    // --- Data Fetching & Realtime ---
    useEffect(() => {
        if (!supabase) return;

        // Auth Session
        supabase.auth.getSession().then(({ data }) => setSession(data?.session || null));
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));

        // Realtime Subscriptions
        const arsipChannel = supabase.channel('public:arsip')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip' },
                (payload) => {
                    // Invalidate React Query cache to ensure lists are updated
                    queryClient.invalidateQueries({ queryKey: ['arsip'] });

                    if (payload.eventType === 'INSERT') {
                        setArsipList(prev => [payload.new, ...prev]);
                        toast.success('Data arsip baru ditambahkan!');
                    } else if (payload.eventType === 'UPDATE') {
                        setArsipList(prev => prev.map(item => item.id === payload.new.id ? payload.new : item));
                        toast.success('Data arsip diperbarui!');
                    } else if (payload.eventType === 'DELETE') {
                        setArsipList(prev => prev.filter(item => item.id !== payload.old.id));
                        toast.success('Data arsip dihapus!');
                    }
                }
            ).subscribe();

        const klasifikasiChannel = supabase.channel('public:klasifikasi')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'klasifikasi' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['klasifikasi'] });
                    if (payload.eventType === 'INSERT') {
                        setKlasifikasiList(prev => [...prev, payload.new].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                    } else if (payload.eventType === 'UPDATE') {
                        setKlasifikasiList(prev => prev.map(item => item.id === payload.new.id ? payload.new : item).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                    } else if (payload.eventType === 'DELETE') {
                        setKlasifikasiList(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            ).subscribe();

        const labelsChannel = supabase.channel('public:labels')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'labels' },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['labels'] });
                    queryClient.invalidateQueries({ queryKey: ARSIP_KEYS.all });
                    if (payload.eventType === 'INSERT') {
                        setLabels(prev => [...prev, payload.new].sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'UPDATE') {
                        setLabels(prev => prev.map(item => item.id === payload.new.id ? payload.new : item).sort((a, b) => a.name.localeCompare(b.name)));
                    } else if (payload.eventType === 'DELETE') {
                        setLabels(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            ).subscribe();

        const archiveLabelsChannel = supabase.channel('public:arsip_labels')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip_labels' },
                () => queryClient.invalidateQueries({ queryKey: ARSIP_KEYS.all })
            ).subscribe();

        return () => {
            authListener?.subscription?.unsubscribe?.();
            supabase.removeChannel(arsipChannel);
            supabase.removeChannel(klasifikasiChannel);
            supabase.removeChannel(labelsChannel);
            supabase.removeChannel(archiveLabelsChannel);
        };
    }, [queryClient, setArsipList, setKlasifikasiList, setLabels]);

    // --- Computed Data ---
    const { activeArchives, inactiveArchives, archivesByYear, statsTrends } = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Calculate previous month/year
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const active = [];
        const inactive = [];
        const byYear = {};

        // Trend counters
        let currentMonthTotal = 0;
        let lastMonthTotal = 0;
        let currentMonthActive = 0;
        let lastMonthActive = 0;
        let currentMonthInactive = 0;
        let lastMonthInactive = 0;

        arsipList.forEach(arsip => {
            const suratDate = new Date(arsip.tanggalSurat);
            const year = suratDate.getFullYear();
            const month = suratDate.getMonth();

            // Year grouping
            if (year && !isNaN(year)) {
                if (!byYear[year]) byYear[year] = { name: year, Aktif: 0, Inaktif: 0 };
            }

            // Status check
            const status = getArsipStatus(arsip, klasifikasiList);
            const isActive = status === 'Aktif';

            if (!isActive) {
                inactive.push(arsip);
                if (year && !isNaN(year)) byYear[year].Inaktif += 1;
            } else {
                active.push(arsip);
                if (year && !isNaN(year)) byYear[year].Aktif += 1;
            }

            // Trend Calculation
            if (year === currentYear && month === currentMonth) {
                currentMonthTotal++;
                if (isActive) currentMonthActive++;
                else currentMonthInactive++;
            } else if (year === lastMonthYear && month === lastMonth) {
                lastMonthTotal++;
                if (isActive) lastMonthActive++;
                else lastMonthInactive++;
            }
        });

        // Helper for percentage calculation
        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            activeArchives: active,
            inactiveArchives: inactive,
            archivesByYear: Object.values(byYear).sort((a, b) => a.name - b.name),
            statsTrends: {
                total: calculateTrend(currentMonthTotal, lastMonthTotal),
                active: calculateTrend(currentMonthActive, lastMonthActive),
                inactive: calculateTrend(currentMonthInactive, lastMonthInactive)
            }
        };
    }, [arsipList, klasifikasiList]);

    // --- Actions ---
    const handleLogout = async () => {
        try {
            await supabase?.auth?.signOut();
            setSession(null);
            toast.success('Berhasil logout');
        } catch { toast.error('Gagal logout'); }
    };

    const handleAdminLogin = async (email, password) => {
        if (!supabase) return;
        try {
            if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
                toast.error('ENV admin belum diset');
                return;
            }
            if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
                toast.error('Kredensial tidak valid');
                return;
            }
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                toast.error(error.message);
                return;
            }
            toast.success('Login berhasil');
        } catch {
            toast.error('Login gagal');
        }
    };

    const confirmDelete = async () => {
        if (deleteConfirmModal.onConfirm) {
            try {
                await deleteConfirmModal.onConfirm();
            } catch (error) {
                console.error("Error in custom delete:", error);
            }
        } else {
            // Default behavior for klasifikasi
            const { deleteKlasifikasiOptimistic, confirmKlasifikasiDelete, rollbackKlasifikasiDelete } = useAppStore.getState();
            const originalData = klasifikasiList.find(k => k.id === deleteConfirmModal.id);

            try {
                deleteKlasifikasiOptimistic(deleteConfirmModal.id);
                const { error } = await supabase.from('klasifikasi').delete().eq('id', deleteConfirmModal.id);
                if (error) {
                    rollbackKlasifikasiDelete(originalData);
                    throw error;
                }
                confirmKlasifikasiDelete(deleteConfirmModal.id);
                toast.success('Kode klasifikasi berhasil dihapus!');
            } catch (error) {
                console.error("Error deleting klasifikasi:", error);
                toast.error(`Gagal menghapus kode klasifikasi: ${error.message}`);
            }
        }
        setDeleteConfirmModal({ show: false, id: null, message: '', onConfirm: null });
    };

    const handleArsipSelect = (item) => {
        if (!item?.id) return;
        queryClient.setQueryData(ARSIP_KEYS.detail(String(item.id)), item);
        const from = getArsipReturnPath(`${location.pathname}${location.search}`);
        navigate(`/arsip/${encodeURIComponent(item.id)}?${new URLSearchParams({ from })}`);
    };

    // --- Render Helpers ---
    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Dashboard';
        if (pathname === '/arsip/tambah') return 'Tambah Arsip';
        if (pathname === '/semua-arsip') return 'Semua Arsip';
        if (pathname === '/arsip') return 'Daftar Arsip';
        if (pathname === '/label') return 'Label & Kategori';
        if (pathname === '/klasifikasi') return 'Kode Klasifikasi';
        if (pathname.startsWith('/arsip/')) return 'Detail Arsip';
        return 'Sistem Arsip';
    };

    // --- Main Render ---

    // Slideshow Logic
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (session) return; // Don't run slideshow if logged in

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [session]);

    if (!supabase) return <ConfigurationMessage />;

    if (!session) {
        return (
            <div style={{ width: 'calc(100vw / 0.8)', height: 'calc(100vh / 0.8)' }} className="flex bg-white overflow-hidden fixed top-0 left-0">
                {/* Left Side - Slideshow */}
                <div className="hidden lg:block w-3/5 relative overflow-hidden bg-primary-950">
                    <AnimatePresence initial={false}>
                        <motion.img
                            key={currentSlide}
                            src={backgroundImages[currentSlide]}
                            alt="UPT Kebun Raya Gunung Tidar"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 1.5,
                                ease: [0.4, 0, 0.2, 1]
                            }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>

                    {/* Overlay Gradient - Clean Bottom Only */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/30 to-transparent" />

                    {/* Text Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="text-white max-w-2xl"
                        >
                            <h1 className="text-4xl font-display font-bold mb-4">Sistem Informasi Manajemen Arsip Terpadu</h1>
                            <p className="text-lg text-neutral-200 opacity-90">UPT Kebun Raya Gunung Tidar</p>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 lg:p-12 bg-white relative">
                    {/* Mobile Background (Absolute) - Visible only on small screens */}
                    <div className="absolute inset-0 lg:hidden z-0">
                        <img src={img1} alt="Background" className="w-full h-full object-cover opacity-10" />
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />
                    </div>

                    <div className="w-full max-w-md relative z-10">
                        <div className="text-center mb-10">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="inline-block p-4 rounded-3xl bg-primary-50 mb-6 shadow-glow-soft"
                            >
                                <img src={logo} alt="SIMANTEP Logo" className="w-16 h-16" />
                            </motion.div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="text-3xl font-display font-bold text-neutral-900 mb-2"
                            >
                                Selamat Datang
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="text-neutral-500"
                            >
                                Silakan masuk untuk mengakses SIMANTEP
                            </motion.p>
                        </div>

                        <AdminLoginForm onSubmit={handleAdminLogin} />

                        <div className="mt-8 text-center">
                            <p className="text-xs text-neutral-400">
                                &copy; {new Date().getFullYear()} UPT Kebun Raya Gunung Tidar.<br />All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Lists and direct detail links handle their own loading/errors independently.
    if (storeLoading && location.pathname === '/') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="flex flex-col items-center gap-4 animate-pulse-soft">
                    <LoadingSpinner type="ring" size={40} color="#6366f1" />
                    <div className="text-lg font-medium text-neutral-600">Memuat Sistem...</div>
                </div>
            </div>
        );
    }

    const commonProps = {
        supabase,
        setEditingArsip,
        editingKlasifikasi,
        setEditingKlasifikasi,
        navigate,
        activeArchives,
        inactiveArchives,
        showNotification: (msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg),
        setDeleteConfirmModal,
        setSelectedArsipDetail: handleArsipSelect
    };

    return (
        <Layout
            user={session.user}
            onLogout={handleLogout}
            title={getPageTitle(location.pathname)}
            arsipList={arsipList}
            setSelectedArsipDetail={handleArsipSelect}
            onNavigate={() => setEditingArsip(null)}
        >
            <Routes>
                <Route path="/" element={
                    dashboardError ? (
                        <div role="alert" className="bg-white border border-red-200 rounded-xl p-6 space-y-3">
                            <p className="font-semibold">Data dashboard gagal dimuat</p>
                            <p className="text-neutral-600">{dashboardError.message || 'Periksa koneksi dan coba kembali.'}</p>
                            <Button onClick={() => { arsipQuery.refetch(); klasifikasiQuery.refetch(); labelsQuery.refetch(); }}>Coba lagi</Button>
                        </div>
                    ) : <Dashboard
                        {...commonProps}
                        stats={{
                            total: arsipList.length,
                            active: activeArchives.length,
                            inactive: inactiveArchives.length
                        }}
                        trends={statsTrends}
                        archivesByYear={archivesByYear}
                    />
                } />
                <Route path="/arsip/tambah" element={
                    <ArsipForm
                        {...commonProps}
                        arsipToEdit={editingArsip}
                        onFinish={() => navigate(getArsipReturnPath(location.state?.returnTo))}
                    />
                } />
                <Route path="/label" element={
                    <LabelDashboard
                        {...commonProps}
                        navigate={navigate}
                    />
                } />
                <Route path="/klasifikasi" element={
                    <KlasifikasiManager {...commonProps} openModal={() => setShowKlasifikasiModal(true)} />
                } />
                <Route path="/semua-arsip" element={
                    <ArsipList {...commonProps} title="Semua Arsip" setEditingArsip={(a) => { setEditingArsip(a); navigate('/arsip/tambah', { state: { returnTo: `${location.pathname}${location.search}` } }); }} />
                } />
                <Route path="/arsip" element={
                    <ArsipList {...commonProps} title="Daftar Arsip" setEditingArsip={(a) => { setEditingArsip(a); navigate('/arsip/tambah', { state: { returnTo: `${location.pathname}${location.search}` } }); }} />
                } />
                <Route path="/arsip/detail" element={
                    <Navigate to="/arsip" replace />
                } />
                <Route path="/arsip/:id" element={<ArsipDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Modals & Overlays */}
            <AnimatePresence>
                {showInfoModal && (
                    <InfoModal onClose={() => setShowInfoModal(false)} />
                )}
                {deleteConfirmModal.show && (
                    <DeleteConfirmModal
                        message={deleteConfirmModal.message}
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteConfirmModal({ show: false, id: null, message: '' })}
                    />
                )}
            </AnimatePresence>

            {/* Modal Tambah/Edit Klasifikasi */}
            <Modal isOpen={showKlasifikasiModal} onClose={() => { setShowKlasifikasiModal(false); setEditingKlasifikasi(null); }} size="lg">
                <ModalHeader onClose={() => { setShowKlasifikasiModal(false); setEditingKlasifikasi(null); }}>
                    <ModalTitle>{editingKlasifikasi ? 'Edit Kode Klasifikasi' : 'Tambah Kode Klasifikasi'}</ModalTitle>
                </ModalHeader>
                <ModalContent>
                    <KlasifikasiForm
                        supabase={supabase}
                        klasifikasiToEdit={editingKlasifikasi}
                        onFinish={() => { setEditingKlasifikasi(null); setShowKlasifikasiModal(false); }}
                        showNotification={(msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg)}
                        klasifikasiList={klasifikasiList}
                    />
                </ModalContent>
            </Modal>
        </Layout>
    );
}
