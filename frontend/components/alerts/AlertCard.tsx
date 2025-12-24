import React from 'react';
import { AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { Alert } from '../../types/factory';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface AlertCardProps {
    alert: Alert;
    onClear: (id: string) => void;
    onClick: (alert: Alert) => void;
}

export default function AlertCard({ alert, onClear, onClick }: AlertCardProps) {
    const isResolved = alert.resolved;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isResolved ? 0.5 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => onClick(alert)}
            className={clsx(
                "p-4 rounded-xl border flex items-start gap-4 transition-all cursor-pointer group relative overflow-hidden",
                isResolved ? "bg-gray-900/50 border-gray-800 grayscale" :
                    alert.severity === 'critical' ? "bg-red-900/10 border-red-900/50 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]" :
                        alert.severity === 'high' ? "bg-orange-900/10 border-orange-900/50 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]" :
                            alert.severity === 'medium' ? "bg-yellow-900/10 border-yellow-900/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]" :
                                "bg-blue-900/10 border-blue-900/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
            )}
        >
            {/* Pulsing Border for new alerts (mock logic: timestamp within 5s) */}
            {!isResolved && Date.now() - alert.timestamp < 5000 && (
                <div className={clsx("absolute inset-0 border-2 rounded-xl animate-pulse",
                    alert.severity === 'critical' ? "border-red-500" :
                        alert.severity === 'high' ? "border-orange-500" :
                            alert.severity === 'medium' ? "border-yellow-500" : "border-blue-500"
                )} />
            )}

            <div className={clsx("p-2 rounded-lg shrink-0",
                isResolved ? "bg-gray-800 text-gray-500" :
                    alert.severity === 'critical' ? "bg-red-900/20 text-red-500" :
                        alert.severity === 'high' ? "bg-orange-900/20 text-orange-500" :
                            alert.severity === 'medium' ? "bg-yellow-900/20 text-yellow-500" :
                                "bg-blue-900/20 text-blue-500"
            )}>
                <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className={clsx("font-bold text-base truncate pr-2", isResolved ? "text-gray-500 line-through" : "text-white")}>
                        {alert.message}
                    </h3>
                    <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap bg-gray-900/50 px-2 py-1 rounded-full border border-gray-800">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={clsx("text-[10px] uppercase font-bold px-2 py-0.5 rounded shadow-sm",
                        alert.severity === 'critical' ? "bg-red-500 text-white" :
                            alert.severity === 'high' ? "bg-orange-500 text-white" :
                                alert.severity === 'medium' ? "bg-yellow-500 text-black" :
                                    "bg-blue-500 text-white"
                    )}>
                        {alert.severity}
                    </span>
                    <span className="text-xs font-mono bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded text-gray-300">{alert.machineId}</span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 border-l border-gray-700 pl-2 ml-1">{alert.type}</span>
                    {alert.count && alert.count > 1 && (
                        <span className="text-[10px] bg-gray-700 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            x{alert.count}
                        </span>
                    )}
                </div>

                {/* AI Suggested Action */}
                {!isResolved && alert.suggested_action && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3"
                    >
                        <div className="flex items-start gap-2">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-blue-300 font-medium mb-1">AI Suggestion</p>
                                <p className="text-sm text-gray-200">{alert.suggested_action}</p>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Mock execute logic
                                            onClear(alert.id);
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-md transition-colors"
                                    >
                                        Execute
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Mock ignore logic (just resolve)
                                            onClear(alert.id);
                                        }}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium rounded-md transition-colors"
                                    >
                                        Ignore
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                {!isResolved && (
                    <button
                        onClick={() => onClear(alert.id)}
                        className="p-2 hover:bg-green-900/30 text-gray-500 hover:text-green-400 rounded-lg transition-colors"
                        title="Mark as Resolved"
                    >
                        <CheckCircle className="w-5 h-5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
