import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ClearAllConfirmProps {
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ClearAllConfirm({ onConfirm, onCancel }: ClearAllConfirmProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onCancel}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl p-6 text-center"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Clear All Alerts?</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Are you sure you want to clear all system alerts? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
