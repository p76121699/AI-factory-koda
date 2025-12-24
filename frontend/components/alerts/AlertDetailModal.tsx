import React from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, Activity, Wrench, Zap, Thermometer, Server } from 'lucide-react';
import { Alert } from '../../types/factory';
import { clsx } from 'clsx';

interface AlertDetailModalProps {
    alert: Alert;
    onClose: () => void;
    onResolve: (id: string) => void;
}

export default function AlertDetailModal({ alert, onClose, onResolve }: AlertDetailModalProps) {

    const getSuggestedAction = (type: string) => {
        switch (type) {
            case 'vibration': return "Inspect bearing alignment and mounting bolts.";
            case 'temperature': return "Check cooling system and airflow vents.";
            case 'blockage': return "Clear output chute and verify sensor alignment.";
            case 'power': return "Verify voltage stability and check for surges.";
            case 'system': return "Restart network module or check connection cables.";
            default: return "Perform standard diagnostic routine.";
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'vibration': return Activity;
            case 'temperature': return Thermometer;
            case 'blockage': return Wrench;
            case 'power': return Zap;
            case 'system': return Server;
            default: return AlertTriangle;
        }
    };

    const Icon = getIcon(alert.type);

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
                className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className={clsx("p-6 border-b border-gray-800 flex items-start gap-4",
                    alert.severity === 'critical' ? "bg-red-900/10" :
                        alert.severity === 'high' ? "bg-orange-900/10" :
                            alert.severity === 'medium' ? "bg-yellow-900/10" : "bg-blue-900/10"
                )}>
                    <div className={clsx("p-3 rounded-xl",
                        alert.severity === 'critical' ? "bg-red-900/20 text-red-500" :
                            alert.severity === 'high' ? "bg-orange-900/20 text-orange-500" :
                                alert.severity === 'medium' ? "bg-yellow-900/20 text-yellow-500" : "bg-blue-900/20 text-blue-500"
                    )}>
                        <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white">{alert.message}</h3>
                        <div className="flex gap-2 mt-2">
                            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded uppercase",
                                alert.severity === 'critical' ? "bg-red-900/30 text-red-400" :
                                    alert.severity === 'high' ? "bg-orange-900/30 text-orange-400" :
                                        alert.severity === 'medium' ? "bg-yellow-900/30 text-yellow-400" : "bg-blue-900/30 text-blue-400"
                            )}>
                                {alert.severity}
                            </span>
                            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                                {alert.machineId}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                                {new Date(alert.timestamp).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Suggested Action</h4>
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-gray-200 flex gap-3 items-start">
                            <Wrench className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p>{getSuggestedAction(alert.type)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Alert Type</p>
                            <p className="text-gray-200 font-medium capitalize">{alert.type}</p>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase">Event Count</p>
                            <p className="text-gray-200 font-medium">{alert.count || 1}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                        >
                            Close
                        </button>
                        {!alert.resolved && (
                            <button
                                onClick={() => { onResolve(alert.id); onClose(); }}
                                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                Mark as Resolved
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
