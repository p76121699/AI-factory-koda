import React from 'react';
import { useFactory } from '../../context/FactoryContext';
import { Sparkles, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIActionLog() {
    const { data } = useFactory();
    const history = data?.ai_history || [];

    if (history.length === 0) return null;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">AI Decision Log</h3>
                </div>
                <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800">
                    Live Feed
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                <AnimatePresence initial={false}>
                    {history.map((entry, i) => (
                        <motion.div
                            key={entry.timestamp + i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-800/50 border border-gray-700 p-3 rounded-lg flex items-start gap-3"
                        >
                            <div className="mt-1">
                                {entry.command.includes('stop') || entry.reason.includes('Safe') ? (
                                    <ShieldCheck className="w-4 h-4 text-green-400" />
                                ) : entry.command.includes('500') || entry.reason.includes('Overheat') ? (
                                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                                ) : (
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-mono text-gray-500">
                                        {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-1.5 rounded uppercase tracking-wider">
                                        {entry.machine_id}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-200 mt-1 font-medium">
                                    {entry.reason}
                                </p>
                                <p className="text-xs text-blue-400 font-mono mt-0.5 truncate">
                                    Executing: {entry.command}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
