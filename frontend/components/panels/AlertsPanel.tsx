"use client";

import React, { useState, useMemo } from 'react';
import { Filter, Trash2, Bell } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import AlertCard from '../alerts/AlertCard';
import AlertDetailModal from '../alerts/AlertDetailModal';
import AlertFilterModal from '../alerts/AlertFilterModal';
import ClearAllConfirm from '../alerts/ClearAllConfirm';
import { Alert } from '../../types/factory';
import { AnimatePresence, motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function AlertsPanel() {
    const { alerts, clearAlert, clearAllAlerts, filterOptions, setFilterOptions } = useFactory();
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    // Filter Logic
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (alert.resolved) return false; // [FIX] Hide resolved alerts immediately
            if (filterOptions.severity && filterOptions.severity.length > 0 && !filterOptions.severity.includes(alert.severity)) return false;
            if (filterOptions.type && filterOptions.type.length > 0 && !filterOptions.type.includes(alert.type)) return false;
            // Add more filters as needed (machineId, timeRange)
            return true;
        });
    }, [alerts, filterOptions]);

    const activeFiltersCount = (filterOptions.severity?.length || 0) + (filterOptions.type?.length || 0);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        System Alerts
                        <span className="text-sm bg-red-900/30 text-red-400 px-2 py-0.5 rounded-full border border-red-900/50">
                            {alerts.filter(a => !a.resolved).length} Active
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm">Monitor and resolve system anomalies</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className={clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border",
                            activeFiltersCount > 0
                                ? "bg-blue-900/20 border-blue-500/50 text-blue-400"
                                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {activeFiltersCount > 0 && <span className="bg-blue-500 text-white text-[10px] px-1.5 rounded-full">{activeFiltersCount}</span>}
                    </button>
                    {alerts.length > 0 && (
                        <button
                            onClick={() => setIsClearConfirmOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-red-900/20 border border-gray-700 hover:border-red-900/50 rounded-lg text-sm text-gray-300 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Clear All
                        </button>
                    )}
                </div>
            </div>

            {/* Alert List */}
            <div className="space-y-3">
                <AnimatePresence initial={false}>
                    {filteredAlerts.length > 0 ? (
                        filteredAlerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                onClear={clearAlert}
                                onClick={setSelectedAlert}
                            />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed"
                        >
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No alerts found matching your criteria.</p>
                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={() => setFilterOptions({})}
                                    className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedAlert && (
                    <AlertDetailModal
                        alert={selectedAlert}
                        onClose={() => setSelectedAlert(null)}
                        onResolve={clearAlert}
                    />
                )}
                {isFilterOpen && (
                    <AlertFilterModal
                        currentFilters={filterOptions}
                        onApply={setFilterOptions}
                        onClose={() => setIsFilterOpen(false)}
                    />
                )}
                {isClearConfirmOpen && (
                    <ClearAllConfirm
                        onConfirm={() => {
                            clearAllAlerts();
                            setIsClearConfirmOpen(false);
                        }}
                        onCancel={() => setIsClearConfirmOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
