import React from 'react';
import { AlertCircle } from 'lucide-react';

const ConfigurationMessage = () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl max-w-md border border-yellow-200 animate-scaleIn">
            <div className="text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                    <AlertCircle className="text-yellow-600" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Konfigurasi Diperlukan</h2>
                <p className="text-gray-600 mb-6">
                    Silakan konfigurasi file .env dengan kredensial Supabase Anda.
                </p>
                <div className="text-left bg-gray-50 border border-gray-200 p-4 rounded-lg text-sm">
                    <p className="font-mono text-gray-700 mb-1">VITE_SUPABASE_URL=your_url_here</p>
                    <p className="font-mono text-gray-700">VITE_SUPABASE_ANON_KEY=your_key_here</p>
                </div>
            </div>
        </div>
    </div>
);

export default ConfigurationMessage;
