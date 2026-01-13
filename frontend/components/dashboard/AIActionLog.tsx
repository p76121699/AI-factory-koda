import React from 'react';
import { useFactory } from '../../context/FactoryContext';
import { Sparkles, Lock, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export default function AIActionLog() {
    const { data } = useFactory();
    const history = data?.ai_history || [];

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Show top 2 items unless expanded
    const displayedHistory = isExpanded ? history : history.slice(0, 2);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">AI Decision Log</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-purple-900/30 text-purple-300 px-2 py-1 rounded border border-purple-800">
                        Live Feed
                    </span>
                    {history.length > 2 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className={clsx("flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 transition-all", isExpanded ? "max-h-[500px]" : "max-h-auto")}>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2 opacity-60">
                        <Sparkles className="w-8 h-8" />
                        <p className="text-sm">AI Autonomy System Standing By...</p>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {displayedHistory.map((entry, i) => (
                            <motion.div
                                key={entry.timestamp + i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
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
                )}
            </div>
            {/* Fade effect when collapsed and more items exist */}
            {!isExpanded && history.length > 2 && (
                <div className="text-center mt-2 text-xs text-gray-500 cursor-pointer hover:text-gray-300" onClick={() => setIsExpanded(true)}>
                    +{history.length - 2} more updates...
                </div>
            )}
        </div>
    );
}
