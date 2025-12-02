import React from 'react';
import { AlertCircle } from 'lucide-react';

const DeleteConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 border border-gray-100 animate-slideUp">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                    <AlertCircle className="text-red-500" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Konfirmasi Hapus</h3>
                <p className="text-gray-600 mb-6 text-center">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
