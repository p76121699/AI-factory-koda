"use client";

import React from 'react';
import { Machine } from '../../types/factory';
import { Activity, Thermometer, Zap, Gauge, AlertTriangle, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useFactory } from '../../context/FactoryContext';

interface MachineCardProps {
    machine: Machine;
    index: number;
}

export default function MachineCard({ machine, index }: MachineCardProps) {
    const { setSelectedMachine } = useFactory();

    const isError = machine.status === "ERROR";
    const isRunning = machine.status === "RUNNING";
    const isIdle = machine.status === "IDLE";
    const isWaiting = machine.status === "WAITING_FOR_REPAIR";
    const isRepairing = machine.status === "REPAIRING";

    // Format index to always be 2 digits (e.g. 01, 05, 12)
    const displayId = (index + 1).toString().padStart(2, '0');

    let statusColor = "text-text-secondary";
    let statusBg = "bg-surface-hover border-border-subtle";
    let glow = "";

    if (isError) {
        statusColor = "text-danger";
        statusBg = "bg-danger/10 border-danger/20";
        glow = "shadow-[0_0_20px_rgba(239,68,68,0.15)]";
    } else if (isRunning) {
        statusColor = "text-success";
        statusBg = "bg-success/10 border-success/20";
        glow = "shadow-[0_0_20px_rgba(34,197,94,0.1)]";
    } else if (isWaiting) {
        statusColor = "text-warning";
        statusBg = "bg-warning/10 border-warning/20";
        glow = "shadow-[0_0_15px_rgba(234,179,8,0.15)]";
    } else if (isRepairing) {
        statusColor = "text-blue-400"; // Assuming primary is blue-ish or using tailwind colors
        statusBg = "bg-blue-500/10 border-blue-500/20";
        glow = "shadow-[0_0_15px_rgba(59,130,246,0.15)]";
    }

    return (
        <motion.div
            layoutId={`machine-${machine.id}`}
            onClick={() => setSelectedMachine(machine)}
            whileHover={{ scale: 1.02, y: -2 }}
            className={clsx(
                "relative p-5 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all duration-300 group overflow-hidden bg-panel border-border-subtle",
                glow
            )}
        >
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    {/* Health Score Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0 -mt-1 -ml-1">
                        <svg className="w-full h-full -rotate-90 -mt-0.75 ml-3.5">
                            <circle cx="24" cy="24" r="20" stroke="var(--color-border-strong)" strokeWidth="4" fill="none" />
                            <circle
                                cx="24" cy="24" r="20"
                                stroke={machine.health_score > 80 ? "var(--color-success)" : machine.health_score > 50 ? "var(--color-warning)" : "var(--color-danger)"}
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="126"
                                strokeDashoffset={126 - (126 * (machine.health_score || 100)) / 100}
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-text-secondary">{Math.round(machine.health_score || 100)}%</span>
                    </div>

                    <div>
                        <h3 className="font-bold text-sm text-text-primary tracking-tight leading-tight -ml-3">{machine.name}</h3>
                        <span className="text-[8px] font-medium text-text-label uppercase tracking-wider -ml-3">{machine.type}</span>
                    </div>
                </div>

                <div className={clsx("px-2.5 py-1 rounded-full text-[8px] font-bold border flex items-center gap-1.5 shrink-0 mt-2 -ml-",
                    statusBg,
                    statusColor
                )}>
                    <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse",
                        isError ? "bg-danger" :
                            isRunning ? "bg-success" :
                                isWaiting ? "bg-warning" :
                                    isRepairing ? "bg-blue-400" :
                                        "bg-text-secondary"
                    )} />
                    {isError && machine.error_code ? machine.error_code :
                        isWaiting ? "WAITING REPAIR" :
                            machine.status}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 relative z-10">
                {getMachineMetrics(machine).map((metric, index) => (
                    <MetricItem
                        key={index}
                        icon={metric.icon}
                        label={metric.label}
                        value={metric.value}
                        alert={metric.alert}
                    />
                ))}
            </div>

            {/* Footer / Hover Action */}
            <div className="mt-5 pt-4 border-t border-border-subtle flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2 text-xs text-text-label">
                    <div className="w-2 h-2 rounded-full bg-primary-500/50" />
                    ID: {displayId}
                </div>
                <motion.button
                    whileHover={{ x: 3 }}
                    className="text-xs font-medium text-primary-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Details <MoreHorizontal className="w-3 h-3" />
                </motion.button>
            </div>
        </motion.div>
    );
}

function MetricItem({ icon: Icon, label, value, alert }: { icon: any, label: string, value: string, alert?: boolean }) {
    return (
        <div className={clsx("p-2.5 rounded-lg border transition-colors h-[68px] flex flex-col justify-center",
            alert ? "bg-danger/10 border-danger/30" : "bg-surface-hover border-border-subtle"
        )}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={clsx("w-3.5 h-3.5", alert ? "text-danger" : "text-text-label")} />
                <span className="text-[10px] uppercase font-semibold text-text-label">{label}</span>
            </div>
            <div className={clsx("font-mono font-medium text-sm", alert ? "text-danger" : "text-text-primary")}>
                {value}
            </div>
        </div>
    );
}

function getMachineMetrics(machine: Machine) {
    const metrics = [];

    switch (machine.type) {
        case 'Cutter':
            metrics.push({ icon: Thermometer, label: 'Temp', value: machine.temperature ? `${machine.temperature.toFixed(1)}°C` : '--', alert: machine.temperature ? machine.temperature > 90 : false });
            metrics.push({ icon: Activity, label: 'Vib', value: machine.vibration ? `${machine.vibration.toFixed(2)} Hz` : '--', alert: machine.vibration ? machine.vibration > 5 : false });
            metrics.push({ icon: Gauge, label: 'Speed', value: machine.speed ? `${machine.speed.toFixed(0)} rpm` : '--' });
            metrics.push({ icon: AlertTriangle, label: 'Wear', value: machine.wear_level ? `${(machine.wear_level * 100).toFixed(0)}%` : '0%', alert: (machine.wear_level || 0) > 0.8 });
            break;
        case 'RobotArm':
            metrics.push({ icon: Zap, label: 'Load', value: machine.load ? `${machine.load.toFixed(1)} kg` : '--' });
            metrics.push({ icon: Activity, label: 'Current', value: (machine as any).current ? `${(machine as any).current.toFixed(1)} A` : '--' });
            metrics.push({ icon: CheckCircle, label: 'Cycles', value: (machine as any).cycles ? `${(machine as any).cycles}` : '0' });
            metrics.push({ icon: AlertTriangle, label: 'Wear', value: machine.wear_level ? `${(machine.wear_level * 100).toFixed(0)}%` : '0%', alert: (machine.wear_level || 0) > 0.8 });
            metrics.push({ icon: Gauge, label: 'Status', value: machine.status });
            break;
        case 'Conveyor':
            metrics.push({ icon: Gauge, label: 'Speed', value: machine.speed ? `${machine.speed.toFixed(2)} m/s` : '--' });
            metrics.push({ icon: Activity, label: 'Load', value: (machine as any).load_count ? `${(machine as any).load_count}` : '0' });
            metrics.push({ icon: AlertTriangle, label: 'Wear', value: machine.wear_level ? `${(machine.wear_level * 100).toFixed(0)}%` : '0%', alert: (machine.wear_level || 0) > 0.8 });
            metrics.push({ icon: Zap, label: 'Power', value: machine.status === 'RUNNING' ? 'ON' : 'OFF' });
            metrics.push({ icon: CheckCircle, label: 'Eff', value: '98%' });
            break;
        case 'Inspector':
            metrics.push({ icon: CheckCircle, label: 'Pass', value: (machine as any).pass_count || '0' });
            metrics.push({ icon: XCircle, label: 'Fail', value: (machine as any).fail_count || '0', alert: (machine as any).fail_count > 5 });
            metrics.push({ icon: Activity, label: 'Rate', value: (machine as any).pass_rate ? `${(machine as any).pass_rate.toFixed(1)}%` : '--' });
            metrics.push({ icon: Gauge, label: 'Total', value: ((machine as any).pass_count + (machine as any).fail_count) || '0' });
            metrics.push({ icon: AlertTriangle, label: 'Wear', value: machine.wear_level ? `${(machine.wear_level * 100).toFixed(0)}%` : '0%', alert: (machine.wear_level || 0) > 0.8 });
            break;
        case 'Packer':
            metrics.push({ icon: CheckCircle, label: 'Packed', value: (machine as any).packed_count || '0' });
            metrics.push({ icon: AlertTriangle, label: 'Jam Rate', value: (machine as any).jam_rate ? `${(machine as any).jam_rate.toFixed(1)}%` : '0%', alert: (machine as any).jam_rate > 1 });
            metrics.push({ icon: Gauge, label: 'Speed', value: machine.status === 'RUNNING' ? 'High' : 'Idle' });
            metrics.push({ icon: AlertTriangle, label: 'Wear', value: machine.wear_level ? `${(machine.wear_level * 100).toFixed(0)}%` : '0%', alert: (machine.wear_level || 0) > 0.8 });
            metrics.push({ icon: Zap, label: 'Power', value: 'Active' });
            break;
        default:
            metrics.push({ icon: Activity, label: 'Status', value: machine.status });
            metrics.push({ icon: Thermometer, label: 'Temp', value: '--' });
            metrics.push({ icon: Gauge, label: 'Speed', value: '--' });
            metrics.push({ icon: Zap, label: 'Load', value: '--' });
    }
    return metrics;
}
