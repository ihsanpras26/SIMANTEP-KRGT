import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

const DeleteConfirmModal = ({ message, onConfirm, onCancel }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-neutral-100"
            >
                <div className="flex items-center justify-center w-14 h-14 mx-auto mb-5 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600" size={28} />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 text-center mb-2">Konfirmasi Hapus</h3>
                <p className="text-neutral-600 mb-6 text-center">{message}</p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        size="default"
                        onClick={onCancel}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        size="default"
                        onClick={onConfirm}
                    >
                        Hapus
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DeleteConfirmModal;

