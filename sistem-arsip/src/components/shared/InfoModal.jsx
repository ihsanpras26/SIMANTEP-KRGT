import React from 'react';
import { XCircle, Archive } from 'lucide-react';

const InfoModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-large p-8 max-w-md w-full relative border border-gray-100 animate-slideUp">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"><XCircle size={24} /></button>
                <div className="flex flex-col items-center text-center">
                    <Archive size={48} className="text-primary-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-3 text-gray-900">Sistem Arsip Digital</h2>
                    <p className="text-gray-600 mb-2 leading-relaxed">Aplikasi Manajemen Kearsipan Digital</p>
                    <p className="text-sm text-gray-500">Aplikasi manajemen arsip digital yang ditenagai oleh React, Vite, Supabase, dan di-hosting di Vercel.</p>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;
