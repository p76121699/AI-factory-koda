"use client";

import React from 'react';
import { useFactory } from '../../context/FactoryContext';
import MachineCard from './MachineCard';
import MachineDetail from './MachineDetail';
import { Server, Activity, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPanel() {
    const { data, selectedMachine } = useFactory();

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p>Connecting to Factory System...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <AnimatePresence>
                {selectedMachine && <MachineDetail />}
            </AnimatePresence>

            {/* KPI Overview Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    label="Total Machines"
                    value={data.lines.reduce((acc, line) => acc + line.machines.length, 0).toString()}
                    subValue="Active Monitoring"
                    icon={Server}
                    color="blue"
                />
                <KPICard
                    label="Global OEE"
                    value="87%"
                    subValue="+2.4% vs last week"
                    icon={Activity}
                    color="green"
                />
                <KPICard
                    label="Active Alerts"
                    value="3"
                    subValue="2 Critical, 1 Warning"
                    icon={AlertTriangle}
                    color="red"
                />
                <KPICard
                    label="Power Usage"
                    value="452 kW"
                    subValue="Peak load at 14:00"
                    icon={Zap}
                    color="yellow"
                />
            </div>

            {data.lines.map((line, index) => (
                <motion.div
                    key={line.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                        <div className="p-2 bg-blue-900/20 rounded-lg">
                            <Server className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-200">
                            {line.name}
                        </h2>
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                            {line.machines.length} Machines
                        </span>
                        {line.current_order ? (
                            <span className="ml-3 text-sm font-normal text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-900/50">
                                Processing {line.current_order.id} • {line.current_order.progress}%
                            </span>
                        ) : (
                            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-800/50 px-2 py-1 rounded border border-gray-700 italic">
                                IDLE - Waiting for Orders
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {line.machines.map((machine, mIndex) => (
                            <MachineCard key={machine.id} machine={machine} index={mIndex} />
                        ))}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function KPICard({ label, value, subValue, icon: Icon, color }: { label: string, value: string, subValue: string, icon: any, color: 'blue' | 'green' | 'red' | 'yellow' }) {
    const colors = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
        yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };

    return (
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex items-start justify-between">
            <div>
                <p className="text-gray-500 text-xs uppercase font-medium tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                <p className="text-xs text-gray-500">{subValue}</p>
            </div>
            <div className={`p-3 rounded-lg border ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
    );
}
