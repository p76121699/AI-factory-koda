"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, Zap, Clock, AlertTriangle, Filter, RefreshCw, ChevronDown, Info } from 'lucide-react';
import { ProductionPoint, EfficiencyStatus, ProductionKPI } from '../../types/factory';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// Mock API Functions
const mockApi = {
    getTimeseries: async (range: string, line: string): Promise<ProductionPoint[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const points: ProductionPoint[] = [];
                const hours = range === '1h' ? 6 : range === '6h' ? 6 : range === '24h' ? 24 : 12;
                const startHour = 8;

                for (let i = 0; i < hours; i++) {
                    points.push({
                        timestamp: `${startHour + i}:00`,
                        lineA: Math.floor(Math.random() * 50) + 100,
                        lineB: Math.floor(Math.random() * 50) + 90,
                        lineC: Math.floor(Math.random() * 50) + 80,
                        cycleTimeA: Number((Math.random() * 2 + 3).toFixed(1)),
                        defectsA: Number((Math.random() * 1).toFixed(1)),
                        energyA: Math.floor(Math.random() * 20) + 30,
                    });
                }
                resolve(points);
            }, 800);
        });
    },

    getKPI: async (): Promise<ProductionKPI> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    totalOutput: 12450 + Math.floor(Math.random() * 100),
                    avgCycleTime: 4.2,
                    energyUsage: 450,
                    defectRate: 0.4,
                    lastUpdate: new Date().toISOString()
                });
            }, 500);
        });
    }
};

import { useFactory } from '../../context/FactoryContext';

export default function ProductionPanel() {
    const { data: factoryData } = useFactory();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('6h');
    const [selectedLine, setSelectedLine] = useState('all');

    const [points, setPoints] = useState<ProductionPoint[]>([]);
    const [efficiency, setEfficiency] = useState<EfficiencyStatus[]>([]);
    const [oee, setOee] = useState(0);
    const [kpi, setKpi] = useState<ProductionKPI | null>(null);

    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
    const [selectedKpiDetail, setSelectedKpiDetail] = useState<string | null>(null);

    // Initial Load & Auto Refresh
    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchKPIs(); // Auto refresh KPIs every 60s
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch on filter change
    useEffect(() => {
        fetchTimeseries();
    }, [timeRange, selectedLine]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await Promise.all([fetchTimeseries(), fetchUtilization(), fetchKPIs()]);
        } catch (err) {
            setError("Unable to load production data. Retry?");
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeseries = async () => {
        try {
            const data = await mockApi.getTimeseries(timeRange, selectedLine);
            setPoints(data);
        } catch (err) {
            console.error("Timeseries fetch failed");
        }
    };

    const fetchUtilization = async () => {
        if (!factoryData) return;

        try {
            // Aggregate Real Data
            const statusCounts = {
                Running: 0,
                Idle: 0,
                Error: 0,
                Maintenance: 0
            };

            let totalEff = 0;
            let machineCount = 0;

            factoryData.lines.forEach(line => {
                line.machines.forEach(m => {
                    // Status Mapping
                    const s = m.status.toUpperCase();
                    if (s === 'RUNNING') statusCounts.Running++;
                    else if (s === 'IDLE' || s === 'STARVED') statusCounts.Idle++;
                    else if (s === 'ERROR' || s === 'WAITING_FOR_REPAIR' || s === 'FAULT') statusCounts.Error++;
                    else if (s === 'MAINTENANCE' || s === 'REPAIRING') statusCounts.Maintenance++;
                    else statusCounts.Idle++; // Default

                    // Efficiency Calculation (from metrics)
                    if (m.metrics && m.metrics.efficiency) {
                        totalEff += m.metrics.efficiency;
                        machineCount++;
                    } else if (s === 'RUNNING') {
                        // Fallback for machines without explicit efficiency metric
                        totalEff += 100;
                        machineCount++;
                    }
                });
            });

            const newEfficiency: EfficiencyStatus[] = [
                { name: 'Running', value: statusCounts.Running },
                { name: 'Idle', value: statusCounts.Idle },
                { name: 'Error', value: statusCounts.Error },
                { name: 'Maintenance', value: statusCounts.Maintenance },
            ];

            // Avg Efficiency or 0
            const avgOee = machineCount > 0 ? Math.round(totalEff / machineCount) : 0;

            setEfficiency(newEfficiency);
            setOee(avgOee);
        } catch (err) {
            console.error("Utilization calc failed", err);
        }
    };

    // Auto-update efficiency when data changes
    useEffect(() => {
        fetchUtilization();
    }, [factoryData]);

    const fetchKPIs = async () => {
        if (factoryData?.kpi) {
            setKpi({
                totalOutput: factoryData.kpi.total_output,
                avgCycleTime: factoryData.kpi.avg_cycle_time,
                energyUsage: factoryData.kpi.energy_usage,
                defectRate: factoryData.kpi.defect_rate,
                lastUpdate: new Date().toISOString()
            });
        }
    };

    const handlePieClick = (entry: any) => {
        setFilterStatus(entry.name === filterStatus ? null : entry.name);
    };

    const handleKpiClick = (type: string) => {
        setSelectedKpiDetail(type);
        setIsKpiModalOpen(true);
    };

    // Filtered points for chart based on Pie selection (Mock logic)
    const chartPoints = useMemo(() => {
        if (!filterStatus) return points;
        // Mock filtering: just reduce values for visual effect
        return points.map(p => ({
            ...p,
            lineA: filterStatus === 'Running' ? p.lineA : p.lineA * 0.2,
            lineB: filterStatus === 'Running' ? p.lineB : p.lineB * 0.2,
            lineC: filterStatus === 'Running' ? p.lineC : p.lineC * 0.2,
        }));
    }, [points, filterStatus]);

    if (loading && !kpi) {
        return <ProductionSkeleton />;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-red-400 bg-gray-900/50 rounded-xl border border-red-900/30">
                <AlertTriangle className="w-12 h-12 mb-4" />
                <p className="text-lg font-medium">{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-300 rounded-lg transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" /> Retry
                </button>
            </div>
        );
    }

    // Custom Tooltip for Line Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-bold text-gray-200 mb-2">{label}</p>
                    {payload.map((p: any) => (
                        <div key={p.name} className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="text-gray-400">{p.name}:</span>
                            <span className="text-white font-mono">{p.value} units</span>
                        </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-gray-800 space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Cycle Time:</span>
                            <span className="text-gray-300 font-mono">{data.cycleTimeA}s</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Defects:</span>
                            <span className="text-red-400 font-mono">{data.defectsA}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-500">Energy:</span>
                            <span className="text-yellow-400 font-mono">{data.energyA} kWh</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Efficiency Display Helper
    const getEfficiencyColor = (val: number) => {
        if (val >= 100) return 'text-purple-400'; // Turbo
        if (val >= 80) return 'text-emerald-400'; // Good
        if (val >= 50) return 'text-yellow-400'; // Warning
        return 'text-red-400'; // Bad
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-400" /> Production Overview
                    </h2>
                    {filterStatus && (
                        <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-400 text-xs border border-blue-800 flex items-center gap-2">
                            Filtered by: {filterStatus}
                            <button onClick={() => setFilterStatus(null)}><XIcon className="w-3 h-3" /></button>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Time Range Selector */}
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 flex">
                        {['1h', '6h', '24h', 'Today'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                    timeRange === range ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-300"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    {/* Line Selector */}
                    <div className="relative">
                        <select
                            value={selectedLine}
                            onChange={(e) => setSelectedLine(e.target.value)}
                            className="appearance-none bg-gray-900 border border-gray-800 text-gray-200 text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-blue-500 cursor-pointer min-w-[200px]"
                        >
                            <option value="all">All Lines</option>
                            {factoryData?.lines?.map((line, index) => (
                                <option key={line.id} value={String.fromCharCode(65 + index)}>
                                    {line.name} ({line.product_type || 'Unknown'})
                                </option>
                            )) || (
                                    <>
                                        <option value="A">Line A</option>
                                        <option value="B">Line B</option>
                                        <option value="C">Line C</option>
                                    </>
                                )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart: Hourly Output */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 h-[450px] flex flex-col relative group">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                            Hourly Output (Units)
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Info className="w-3 h-3" /> Hover for details
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartPoints}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="timestamp"
                                    stroke="#6b7280"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Legend />
                                {(selectedLine === 'all' || selectedLine === 'A') && (
                                    <Line type="monotone" dataKey="lineA" name="Line A" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                                )}
                                {(selectedLine === 'all' || selectedLine === 'B') && (
                                    <Line type="monotone" dataKey="lineB" name="Line B" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                                )}
                                {(selectedLine === 'all' || selectedLine === 'C') && (
                                    <Line type="monotone" dataKey="lineC" name="Line C" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Secondary Chart: Machine Utilization */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-[450px] flex flex-col">
                    <h3 className="font-semibold text-gray-200 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-yellow-400" /> Machine Utilization
                    </h3>
                    <div className="flex-1 w-full min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, left: 0, bottom: 0, right: 0 }}>
                                <Pie
                                    data={efficiency.map(e => ({ name: e.name, value: e.value }))}
                                    cx="50%"
                                    cy="70%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="value"
                                    onClick={handlePieClick}
                                    cursor="pointer"
                                    stroke="none"
                                    isAnimationActive={false}
                                >
                                    {efficiency.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.name === 'Running' ? '#10b981' :
                                                    entry.name === 'Idle' ? '#f59e0b' :
                                                        entry.name === 'Error' ? '#ef4444' : '#374151'
                                            }
                                            opacity={filterStatus && filterStatus !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Interactive KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Avg Efficiency"
                    value={`${oee}%`}
                    subValue={oee > 100 ? "TURBO MODE ACTIVE" : "Real-time OEE"}
                    color={oee >= 100 ? "purple" : oee >= 80 ? "green" : oee >= 50 ? "yellow" : "red"}
                    onClick={() => handleKpiClick('efficiency')}
                    tooltip="Overall Equipment Effectiveness (OEE). Values >100% indicate Turbo Mode is active."
                />
                <KPICard
                    title="Total Output"
                    value={kpi?.totalOutput.toLocaleString() || '0'}
                    subValue="Today's Accumulation"
                    onClick={() => handleKpiClick('output')}
                    tooltip="Total number of finished units produced across all active production lines."
                />
                <KPICard
                    title="Avg Cycle Time"
                    value={`${kpi?.avgCycleTime || '0.0'}s`}
                    subValue="-2.1% vs Yesterday"
                    color="blue"
                    onClick={() => handleKpiClick('cycle')}
                    tooltip="Average time taken to complete one full production cycle from raw material to finished good."
                />
                <KPICard
                    title="Energy Usage"
                    value={`${kpi?.energyUsage || '0'} kWh`}
                    subValue="~150 kWh per Line"
                    color="yellow"
                    onClick={() => handleKpiClick('energy')}
                    tooltip="Cumulative energy consumption in Kilowatt-hours (kWh) for the current session."
                />
                <KPICard
                    title="Defect Rate"
                    value={`${kpi?.defectRate || '0.0'}%`}
                    subValue="Peak: 14:00-15:00"
                    color="red"
                    onClick={() => handleKpiClick('defects')}
                    tooltip="Percentage of products failing quality inspection. Target is < 1.0%."
                />
            </div>

            {/* KPI Detail Modal */}
            <AnimatePresence>
                {isKpiModalOpen && (
                    <KPIModal
                        title={selectedKpiDetail || ''}
                        onClose={() => setIsKpiModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Sub-components


function KPICard({ title, value, subValue, color = "gray", onClick, tooltip }: any) {
    const colors: any = {
        gray: "text-white",
        blue: "text-blue-400",
        yellow: "text-yellow-400",
        green: "text-green-400",
        purple: "text-purple-400",
        red: "text-red-400",
    };

    return (
        <motion.div
            layout
            onClick={onClick}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl cursor-pointer hover:border-gray-700 transition-colors group relative overflow-visible"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="text-gray-400 text-xs font-medium uppercase tracking-wider truncate">{title}</span>

                {/* Tooltip Wrapper */}
                <div className="relative group/info bg-transparent p-1 -mr-1 -mt-1 rounded-full hover:bg-gray-800 transition-colors">
                    <Info className="w-3.5 h-3.5 text-gray-500 group-hover/info:text-gray-300 transition-colors" />

                    {/* Tooltip Content */}
                    <div className="absolute right-0 top-full mt-2 w-48 p-3 bg-gray-800 text-xs text-gray-300 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-50 pointer-events-none">
                        <div className="relative z-10">
                            {tooltip || title}
                        </div>
                        {/* Arrow */}
                        <div className="absolute right-1.5 -top-1 w-2 h-2 bg-gray-800 border-t border-l border-gray-700 transform rotate-45"></div>
                    </div>
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <span className={clsx("text-2xl font-bold transition truncate", colors[color] || colors.gray)}>
                    {value}
                </span>
            </div>
            <span className="text-xs text-gray-500 mt-1 block truncate">{subValue}</span>
        </motion.div>
    );
}

function KPIModal({ title, onClose }: { title: string, onClose: () => void }) {
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
                className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">{title} Details</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-gray-400 hover:text-white" /></button>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-400 text-sm">Detailed breakdown for {title} would appear here.</p>
                    <div className="h-32 bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-800 border-dashed">
                        <span className="text-gray-600 text-xs">Chart / Table Placeholder</span>
                    </div>
                    <button onClick={onClose} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium">
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ProductionSkeleton() {
    return (
        <div className="space-y-6 pb-20 animate-pulse">
            <div className="flex justify-between">
                <div className="h-8 w-48 bg-gray-800 rounded" />
                <div className="flex gap-2">
                    <div className="h-8 w-32 bg-gray-800 rounded" />
                    <div className="h-8 w-32 bg-gray-800 rounded" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 h-[450px]">
                    <div className="h-6 w-32 bg-gray-800 rounded mb-6" />
                    <div className="h-full bg-gray-800/50 rounded" />
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-[450px]">
                    <div className="h-6 w-32 bg-gray-800 rounded mb-6" />
                    <div className="w-48 h-48 mx-auto bg-gray-800 rounded-full mt-10" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-900 border border-gray-800 p-4 rounded-xl h-24" />
                ))}
            </div>
        </div>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );
}
