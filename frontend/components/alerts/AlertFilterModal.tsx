import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Filter, Check } from 'lucide-react';
import { AlertFilterOptions, AlertSeverity } from '../../types/factory';
import { clsx } from 'clsx';

interface AlertFilterModalProps {
    currentFilters: AlertFilterOptions;
    onApply: (filters: AlertFilterOptions) => void;
    onClose: () => void;
}

export default function AlertFilterModal({ currentFilters, onApply, onClose }: AlertFilterModalProps) {
    const [filters, setFilters] = useState<AlertFilterOptions>(currentFilters);

    const toggleSeverity = (sev: AlertSeverity) => {
        const current = filters.severity || [];
        const updated = current.includes(sev)
            ? current.filter(s => s !== sev)
            : [...current, sev];
        setFilters({ ...filters, severity: updated.length ? updated : undefined });
    };

    const toggleType = (type: string) => {
        const current = filters.type || [];
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        setFilters({ ...filters, type: updated.length ? updated : undefined });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        setFilters({});
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-400" /> Filter Alerts
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Severity Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase mb-3">Severity</label>
                        <div className="flex flex-wrap gap-2">
                            {(['critical', 'high', 'medium', 'low'] as AlertSeverity[]).map(sev => (
                                <button
                                    key={sev}
                                    onClick={() => toggleSeverity(sev)}
                                    className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                                        filters.severity?.includes(sev)
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                                    )}
                                >
                                    {filters.severity?.includes(sev) && <Check className="w-3 h-3" />}
                                    <span className="capitalize">{sev}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase mb-3">Alert Type</label>
                        <div className="flex flex-wrap gap-2">
                            {['vibration', 'temperature', 'blockage', 'power', 'system'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={clsx("px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2",
                                        filters.type?.includes(type)
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
                                    )}
                                >
                                    {filters.type?.includes(type) && <Check className="w-3 h-3" />}
                                    <span className="capitalize">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-800">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                        >
                            Reset
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
