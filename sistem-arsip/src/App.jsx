import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAppStore from './store/useAppStore';

// Layout & Components
import Layout from './components/Layout';
import ArsipForm from './components/ArsipForm';
import KlasifikasiManager from './components/KlasifikasiManager';
import ArsipList from './components/ArsipList';
import Dashboard from './pages/Dashboard';
import AdminLoginForm from './components/AdminLoginForm';
import ConfigurationMessage from './components/ConfigurationMessage';
import LoadingSpinner from './components/LoadingSpinner';
import InfoModal from './components/InfoModal';
import ArsipDetailModal from './components/ArsipDetailModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import KlasifikasiForm from './components/KlasifikasiForm';
import { Modal, ModalHeader, ModalTitle, ModalContent } from './components/ui';

// Styles
import './animations.css';

// --- Konfigurasi Supabase ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
const isValidConfig = supabaseUrl && supabaseAnonKey && 
    !supabaseUrl.includes('your_supabase_project_url_here') && 
    !supabaseAnonKey.includes('your_supabase_anon_key_here');

if (isValidConfig) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.error('Missing or invalid Supabase configuration. Please check your .env file.');
}

export default function App() {
    // --- State Management ---
    const [currentView, setCurrentView] = useState('dashboard');
    const [session, setSession] = useState(null);
    const [initialFilter, setInitialFilter] = useState('all');
    
    // Zustand store
    const {
        arsipList,
        klasifikasiList,
        isLoading: storeLoading,
        setArsipList,
        setKlasifikasiList,
        setIsLoading: setStoreLoading
    } = useAppStore();

    // Modal & Edit States
    const [editingArsip, setEditingArsip] = useState(null);
    const [editingKlasifikasi, setEditingKlasifikasi] = useState(null);
    const [showKlasifikasiModal, setShowKlasifikasiModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedArsipDetail, setSelectedArsipDetail] = useState(null);
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

        // Initial Data Fetch
        const fetchData = async () => {
            setStoreLoading(true);
            
            // Fetch Arsip
            const { data: arsipData, error: arsipError } = await supabase
                .from('arsip')
                .select('*')
                .order('tanggalSurat', { ascending: false });
            
            if (arsipError) {
                console.error("Error fetching arsip:", arsipError);
                toast.error(`Gagal memuat data arsip: ${arsipError.message}`);
            } else {
                setArsipList(arsipData || []);
            }

            // Fetch Klasifikasi (with pagination for large datasets)
            const PAGE_SIZE = 1000;
            let allKlasifikasi = [];
            let from = 0;
            let hasMore = true;
            
            while (hasMore) {
                const to = from + PAGE_SIZE - 1;
                const { data: pageData, error: pageError } = await supabase
                    .from('klasifikasi')
                    .select('*')
                    .order('kode', { ascending: true })
                    .range(from, to);
                    
                if (pageError) {
                    console.error("Error fetching klasifikasi:", pageError);
                    toast.error(`Gagal memuat data klasifikasi: ${pageError.message}`);
                    break;
                }
                
                allKlasifikasi = allKlasifikasi.concat(pageData || []);
                if (!pageData || pageData.length < PAGE_SIZE) {
                    hasMore = false;
                } else {
                    from += PAGE_SIZE;
                }
            }
            
            const sorted = (allKlasifikasi || []).slice().sort((a, b) => 
                a.kode.localeCompare(b.kode, undefined, { numeric: true })
            );
            setKlasifikasiList(sorted);
            setStoreLoading(false);
        };

        fetchData();

        // Realtime Subscriptions
        const arsipChannel = supabase.channel('public:arsip')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'arsip' }, 
                (payload) => {
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
                    if (payload.eventType === 'INSERT') {
                        setKlasifikasiList(prev => [...prev, payload.new].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                    } else if (payload.eventType === 'UPDATE') {
                        setKlasifikasiList(prev => prev.map(item => item.id === payload.new.id ? payload.new : item).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true })));
                    } else if (payload.eventType === 'DELETE') {
                        setKlasifikasiList(prev => prev.filter(item => item.id !== payload.old.id));
                    }
                }
            ).subscribe();

        return () => {
            authListener?.subscription?.unsubscribe?.();
            supabase.removeChannel(arsipChannel);
            supabase.removeChannel(klasifikasiChannel);
        };
    }, []);

    // --- Computed Data ---
    const { activeArchives, inactiveArchives, archivesByYear } = useMemo(() => {
        const today = new Date();
        const active = [];
        const inactive = [];
        const byYear = {};

        arsipList.forEach(arsip => {
            const retensiDate = new Date(arsip.tanggalRetensi);
            const year = new Date(arsip.tanggalSurat).getFullYear();
            
            if (year && !isNaN(year)) {
                if (!byYear[year]) byYear[year] = { name: year, Aktif: 0, Inaktif: 0 };
            }

            if (retensiDate && today > retensiDate) {
                inactive.push(arsip);
                if(year && !isNaN(year)) byYear[year].Inaktif += 1;
            } else {
                active.push(arsip);
                if(year && !isNaN(year)) byYear[year].Aktif += 1;
            }
        });

        return { 
            activeArchives: active, 
            inactiveArchives: inactive,
            archivesByYear: Object.values(byYear).sort((a,b) => a.name - b.name)
        };
    }, [arsipList]);

    // --- Actions ---
    const handleLogout = async () => {
        try {
            await supabase?.auth?.signOut();
            setSession(null);
            toast.success('Berhasil logout');
        } catch (e) {}
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
        } catch (e) {
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

    const navigate = (view, filter = 'all') => {
        setCurrentView(view);
        setInitialFilter(filter);
        if (view !== 'tambah') setEditingArsip(null);
        if (view !== 'klasifikasi') setEditingKlasifikasi(null);
    };

    // --- Render Helpers ---
    const getPageTitle = () => {
        switch (currentView) {
            case 'dashboard': return 'Dashboard';
            case 'tambah': return 'Tambah Arsip';
            case 'semua': return 'Semua Arsip';
            case 'arsip': return 'Daftar Arsip';
            case 'klasifikasi': return 'Kode Klasifikasi';
            default: return 'Sistem Arsip';
        }
    };

    const renderView = () => {
        const props = { 
            supabase, 
            klasifikasiList, 
            setEditingArsip, 
            editingKlasifikasi, 
            setEditingKlasifikasi, 
            navigate, 
            arsipList, 
            activeArchives, 
            inactiveArchives, 
            showNotification: (msg, type) => type === 'error' ? toast.error(msg) : toast.success(msg), 
            setDeleteConfirmModal, 
            setSelectedArsipDetail 
        };

        switch (currentView) {
            case 'tambah':
                return <ArsipForm {...props} arsipToEdit={editingArsip} arsipList={arsipList} onFinish={() => navigate('dashboard')} />;
            case 'klasifikasi':
                return <KlasifikasiManager {...props} openModal={() => setShowKlasifikasiModal(true)} />;
            case 'semua':
                return <ArsipList {...props} title="Semua Arsip" arsipList={arsipList} setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} setSelectedArsipDetail={setSelectedArsipDetail} listType="semua" initialFilter={initialFilter} />;
            case 'arsip':
                return <ArsipList {...props} title="Daftar Arsip" arsipList={arsipList} setEditingArsip={(a) => { setEditingArsip(a); navigate('tambah'); }} setSelectedArsipDetail={setSelectedArsipDetail} listType="arsip" initialFilter={initialFilter} />;
            default:
                return <Dashboard {...props} stats={{ total: arsipList.length, active: activeArchives.length, inactive: inactiveArchives.length }} archivesByYear={archivesByYear} />;
        }
    };

    // --- Main Render ---
    if (!isValidConfig) return <ConfigurationMessage />;

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-neutral-100 w-full max-w-md animate-scale-in">
                    <h2 className="text-2xl font-display font-bold text-neutral-900 mb-6 text-center">Login Admin</h2>
                    <AdminLoginForm onSubmit={handleAdminLogin} />
                </div>
            </div>
        );
    }

    if (storeLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50">
                <div className="flex flex-col items-center gap-4 animate-pulse-soft">
                    <LoadingSpinner type="ring" size={40} color="#6366f1" />
                    <div className="text-lg font-medium text-neutral-600">Memuat Sistem...</div>
                </div>
            </div>
        );
    }

    return (
        <Layout 
            currentView={currentView} 
            onNavigate={navigate} 
            user={session.user} 
            onLogout={handleLogout}
            title={getPageTitle()}
            arsipList={arsipList}
            setSelectedArsipDetail={setSelectedArsipDetail}
        >
            {renderView()}

            {/* Modals & Overlays */}
            <AnimatePresence>
                {showInfoModal && (
                    <InfoModal onClose={() => setShowInfoModal(false)} />
                )}
                {selectedArsipDetail && (
                    <ArsipDetailModal 
                        arsip={selectedArsipDetail} 
                        klasifikasiList={klasifikasiList}
                        onClose={() => setSelectedArsipDetail(null)} 
                    />
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
