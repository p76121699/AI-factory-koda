"use client";

import React, { useState, useEffect } from 'react';
import { useFactory } from '../../context/FactoryContext';
import { X, Play, Square, RefreshCw, AlertTriangle, Thermometer, Activity, Zap, CheckCircle, Gauge as GaugeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { clsx } from 'clsx';

// --- Helper Components ---

function NeedleGauge({ value, max, label, unit, color = "text-blue-400", zones = [] }: { value: number, max: number, label: string, unit: string, color?: string, zones?: { color: string, limit: number }[] }) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const angle = (percentage / 100) * 180 - 90; // -90 to +90 degrees

    return (
        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center relative min-h-[160px]">
            <p className="text-gray-500 text-xs uppercase font-bold absolute top-4 left-4">{label}</p>

            <div className="relative w-40 h-24 mt-4 flex items-end justify-center overflow-hidden">
                <svg viewBox="0 0 200 110" className="w-full h-full">

                    {/* Background Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#374151" strokeWidth="15" strokeLinecap="butt" />

                    {/* Active Arc */}
                    <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="15" strokeDasharray="251" strokeDashoffset={251 - (251 * percentage / 100)} className={clsx("transition-all duration-500", color.replace('text-', 'stroke-'))} />

                    {/* Ticks */}
                    {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => {
                        const ang = (p / 100) * 180 - 180;
                        const rad = (ang * Math.PI) / 180;
                        // Outer rim ticks
                        const x1 = 100 + 88 * Math.cos(rad);
                        const y1 = 100 + 88 * Math.sin(rad);
                        const x2 = 100 + 95 * Math.cos(rad);
                        const y2 = 100 + 95 * Math.sin(rad);
                        return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6b7280" strokeWidth="2" />
                    })}

                    {/* Needle */}
                    <g transform={`rotate(${angle}, 100, 100)`} className="transition-transform duration-500 ease-out">
                        <polygon points="100,100 95,100 100,20 105,100" fill="#ef4444" />
                        <circle cx="100" cy="100" r="6" fill="#374151" />
                    </g>

                    {/* Value Readout */}
                    <rect x="70" y="75" width="60" height="25" rx="4" fill="#1f2937" />
                    <text x="100" y="93" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">{value.toFixed(1)}</text>
                </svg>
            </div>
            <span className="text-xs text-gray-500 mt-1">{unit}</span>
        </div>
    );
}

function MetricBox({ label, value, unit, icon: Icon, alert }: { label: string, value: string | number, unit?: string, icon?: any, alert?: boolean }) {
    return (
        <div className={clsx("bg-gray-800/30 p-4 rounded-xl border flex flex-col justify-center",
            alert ? "border-red-500/50 bg-red-900/10" : "border-gray-700"
        )}>
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon className={clsx("w-4 h-4", alert ? "text-red-400" : "text-gray-500")} />}
                <p className={clsx("text-xs uppercase font-bold", alert ? "text-red-400" : "text-gray-500")}>{label}</p>
            </div>
            <p className={clsx("text-2xl font-mono", alert ? "text-red-100" : "text-white")}>
                {value} <span className="text-sm text-gray-500 font-sans">{unit}</span>
            </p>
        </div>
    );
}

export default function MachineDetail() {
    const { selectedMachine, setSelectedMachine, controlMachine } = useFactory();
    const [history, setHistory] = useState<any[]>([]);

    // Reset history when machine changes
    useEffect(() => {
        setHistory([]);
    }, [selectedMachine?.id]);

    // Accumulate history
    useEffect(() => {
        if (!selectedMachine) return;
        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        setHistory(prev => {
            const newItem = {
                time: timeStr,
                temp: selectedMachine.temperature || 0,
                vib: selectedMachine.vibration || 0,
                speed: selectedMachine.speed || 0,
                current: (selectedMachine as any).current || 0,
                load: (selectedMachine as any).load || selectedMachine.metrics?.load || 0,
                pass: (selectedMachine as any).pass_rate || 0,
            };
            const newHistory = [...prev, newItem];
            if (newHistory.length > 30) return newHistory.slice(newHistory.length - 30);
            return newHistory;
        });
    }, [selectedMachine]);

    if (!selectedMachine) return null;

    const renderCutterViews = () => (
        <>
            <div className="col-span-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <MetricBox label="Temp" value={(selectedMachine.temperature || 0).toFixed(1)} unit="°C" icon={Thermometer} alert={(selectedMachine.temperature || 0) > 90} />
                    <MetricBox label="Speed" value={(selectedMachine.speed || 0).toFixed(0)} unit="rpm" icon={Activity} />
                    <MetricBox label="Vibration" value={(selectedMachine.vibration || 0).toFixed(2)} unit="Hz" icon={Activity} />
                    <MetricBox label="Wear" value={((selectedMachine.wear_level || 0) * 100).toFixed(0)} unit="%" icon={AlertTriangle} alert={(selectedMachine.wear_level || 0) > 0.8} />
                </div>
                <MachineControls machine={selectedMachine} controlMachine={controlMachine} />
            </div>
            <div className="col-span-8 flex flex-col gap-6">
                <ChartCard title="Temperature Trend" data={history} dataKey="temp" color="#ef4444" unit="°C" />
                <ChartCard title="Vibration Analysis" data={history} dataKey="vib" color="#3b82f6" unit="Hz" />
            </div>
        </>
    );

    const renderRobotArmViews = () => (
        <>
            <div className="col-span-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {/* Gauge for Load 0-10kg */}
                    <NeedleGauge value={(selectedMachine as any).load || 0} max={10} label="Load" unit="kg" color="text-yellow-400" />
                    <div className="flex flex-col gap-4">
                        <MetricBox label="Cycles" value={(selectedMachine as any).cycles || 0} icon={RefreshCw} />
                        <MetricBox label="Wear" value={((selectedMachine.wear_level || 0) * 100).toFixed(0)} unit="%" icon={AlertTriangle} alert={(selectedMachine.wear_level || 0) > 0.8} />
                    </div>
                </div>
                <MetricBox label="Current Status" value={(selectedMachine as any).current?.toFixed(1) || 0} unit="A" icon={Zap} />
                <MachineControls machine={selectedMachine} controlMachine={controlMachine} />
            </div>
            <div className="col-span-8 flex flex-col gap-6">
                {/* Current Chart */}
                <ChartCard title="Current Draw (Amps)" data={history} dataKey="current" color="#eab308" unit="A" />
                <div className="grid grid-cols-2 gap-4 h-48">
                    <AlertList />
                </div>
            </div>
        </>
    );

    const renderConveyorViews = () => (
        <>
            <div className="col-span-4 space-y-6">
                {/* UPDATED: Only Speed Gauge, removed Load Gauge */}
                <div className="flex justify-center mb-4">
                    <div className="w-full">
                        <NeedleGauge value={selectedMachine.speed || 0} max={2.0} label="Speed" unit="m/s" color="text-green-400" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <MetricBox label="Processed" value={(selectedMachine as any).load_count?.toFixed(0) || 0} icon={CheckCircle} />
                    <MetricBox label="Power" value={selectedMachine.status === 'RUNNING' ? "ON" : "OFF"} icon={Zap} />
                </div>
                <MachineControls machine={selectedMachine} controlMachine={controlMachine} />
            </div>
            <div className="col-span-8 flex flex-col gap-6">
                {/* Load is now only shown in chart */}
                <ChartCard title="Load Trend" data={history} dataKey="load" color="#60a5fa" unit="Items" />
                <AlertList />
            </div>
        </>
    );

    const renderInspectorViews = () => {
        const metrics = (selectedMachine as any).metrics || {};
        const pass = metrics.pass_count || 0;
        const fail = metrics.fail_count || 0;
        const total = pass + fail;
        const passRate = Number((selectedMachine as any).pass_rate) || 0;

        const pieData = total > 0 ? [
            { name: 'Pass', value: pass, color: '#4ade80' },
            { name: 'Fail', value: fail, color: '#ef4444' },
        ] : [
            { name: 'No Data', value: 1, color: '#374151' }
        ];

        return (
            <>
                <div className="col-span-4 space-y-6">
                    <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700">
                        <p className="text-gray-500 text-xs uppercase font-bold mb-2">Quality Ratio</p>

                        {/* 使用 flex 確保內容撐開，並給予一個最小高度 */}
                        <div className="w-full h-[220px] relative flex justify-center items-center">
                            {/* 這裡不再使用 ResponsiveContainer，直接給 PieChart 寬高確保渲染 */}
                            <PieChart width={250} height={220}>
                                <Pie
                                    key={`pie-${total}`} // 強制數據更新時 Remount
                                    data={pieData}
                                    cx={125} // 直接寫死圓心位置 (250的一半)
                                    cy={100} // 直接寫死圓心位置
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#d4dbe6ff', borderRadius: '8px', border: '1px solid #374151' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                />
                            </PieChart>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricBox label="Total" value={total} icon={Activity} />
                        <MetricBox label="Pass Rate" value={passRate.toFixed(1)} unit="%" icon={CheckCircle} />
                    </div>
                    <MachineControls machine={selectedMachine} controlMachine={controlMachine} />
                </div>

                <div className="col-span-8 flex flex-col gap-6">
                    <ChartCard title="Pass Rate Trend" data={history} dataKey="pass" color="#4ade80" unit="%" />
                    <AlertList />
                </div>
            </>
        );
    };

    const renderPackerViews = () => (
        <>
            <div className="col-span-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <NeedleGauge value={selectedMachine.status === 'RUNNING' ? 100 : 0} max={100} label="Speed" unit="%" color="text-purple-400" />
                    <MetricBox label="Packed" value={(selectedMachine as any).packed_count || 0} icon={CheckCircle} />
                </div>
                <MetricBox label="Jam Rate" value={(selectedMachine as any).jam_rate || 0} unit="%" icon={AlertTriangle} alert={(selectedMachine as any).jam_rate > 0} />
                <MachineControls machine={selectedMachine} controlMachine={controlMachine} />
            </div>
            <div className="col-span-8 flex flex-col gap-6">
                <AlertList />
                <div className="bg-gray-800/20 rounded-xl border border-gray-700 h-64 flex items-center justify-center text-gray-600">
                    No historic data for Packer
                </div>
            </div>
        </>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedMachine(null)}
        >
            <motion.div
                layoutId={`machine-${selectedMachine.id}`}
                className="bg-gray-900 border border-gray-700 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
                    <div className="flex items-center gap-6">
                        <div className={clsx("w-3 h-16 rounded-full",
                            selectedMachine.status === 'ERROR' ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" :
                                selectedMachine.status === 'RUNNING' ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" :
                                    "bg-gray-500"
                        )} />

                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{selectedMachine.name}</h2>
                            <div className="flex items-center gap-4 text-gray-400 text-sm mt-1">
                                <span className="bg-gray-800 px-2 py-0.5 rounded text-xs border border-gray-700 font-mono">{selectedMachine.id}</span>
                                <span className="uppercase tracking-wider font-medium">{selectedMachine.type}</span>
                                <div className="flex items-center gap-2 pl-2 border-l border-gray-700">
                                    <span className="text-gray-500">Health:</span>
                                    <span className={clsx("font-bold",
                                        (selectedMachine.health_score || 100) > 80 ? "text-green-400" : "text-yellow-400"
                                    )}>{Math.round(selectedMachine.health_score || 100)}%</span>
                                </div>
                                {selectedMachine.error_code && selectedMachine.status === 'ERROR' && (
                                    <span className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded text-xs border border-red-800 font-bold">
                                        {selectedMachine.error_code}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setSelectedMachine(null)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Specific Content Wrapper */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6">
                    {selectedMachine.type === 'Cutter' && renderCutterViews()}
                    {selectedMachine.type === 'RobotArm' && renderRobotArmViews()}
                    {selectedMachine.type === 'Conveyor' && renderConveyorViews()}
                    {selectedMachine.type === 'Inspector' && renderInspectorViews()}
                    {selectedMachine.type === 'Packer' && renderPackerViews()}
                </div>
            </motion.div>
        </motion.div>
    );
}

// --- Subcomponents ---

function ChartCard({ title, data, dataKey, color, unit }: any) {
    return (
        <div className="bg-gray-800/30 p-5 rounded-xl border border-gray-700 h-64 flex flex-col">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color }} /> {title}
            </h3>
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} tickMargin={10} />
                        <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickMargin={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} itemStyle={{ color: '#f3f4f6' }} />
                        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${dataKey})`} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function AlertList() {
    return (
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 flex-1">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Recent Alerts</h3>
            <div className="space-y-3">
                <p className="text-xs text-gray-500 italic">No recent alerts</p>
            </div>
        </div>
    );
}

function MachineControls({ machine, controlMachine }: any) {
    return (
        <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Machine Control</h3>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => controlMachine(machine.id, 'start')}
                    disabled={machine.status === 'RUNNING'}
                    className="flex flex-col items-center justify-center p-4 bg-green-900/20 border border-green-800/50 rounded-lg hover:bg-green-900/40 text-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <Play className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Start</span>
                </button>
                <button
                    onClick={() => controlMachine(machine.id, 'stop')}
                    disabled={machine.status === 'IDLE' || machine.status === 'ERROR'}
                    className="flex flex-col items-center justify-center p-4 bg-red-900/20 border border-red-800/50 rounded-lg hover:bg-red-900/40 text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <Square className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Stop</span>
                </button>
                <button
                    onClick={() => controlMachine(machine.id, 'reset')}
                    disabled={machine.status !== 'ERROR' && machine.status !== 'IDLE'}
                    className="flex flex-col items-center justify-center p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg hover:bg-blue-900/40 text-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    <RefreshCw className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Reset</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg hover:bg-yellow-900/40 text-yellow-400 transition-all active:scale-95">
                    <AlertTriangle className="w-6 h-6 mb-1" />
                    <span className="text-xs font-medium">Report</span>
                </button>
            </div>
        </div>
    );
}
