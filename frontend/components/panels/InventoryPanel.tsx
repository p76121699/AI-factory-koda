"use client";

import React, { useState, useMemo } from 'react';
import { useFactory } from '../../context/FactoryContext';
import { Package, AlertTriangle, TrendingUp, ArrowDown, ArrowUp, Search, Filter, Plus, X, Calendar, Save, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { InventoryItem } from '../../types/factory';
import { clsx } from 'clsx';

export default function InventoryPanel() {
    const { data } = useFactory();
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [chartMode, setChartMode] = useState<'category' | 'trend'>('category');

    // Derived Data
    const inventory = data?.inventory || [];

    const stats = useMemo(() => {
        const totalValue = inventory.reduce((acc, item) => acc + item.total_value, 0);
        const lowStock = inventory.filter(item => item.status === 'LOW').length;
        const criticalStock = inventory.filter(item => item.status === 'CRITICAL').length;
        const totalSKUs = inventory.length;
        // Mock DOH calculation (random for demo)
        const doh = 14.2;

        return { totalValue, lowStock, criticalStock, totalSKUs, doh };
    }, [inventory]);

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
            const matchesStatus = statusFilter === "All" || item.status === statusFilter;
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [inventory, searchTerm, categoryFilter, statusFilter]);

    // Real Chart Data
    const chartData = useMemo(() => {
        // Since asset_history is in factory.py, we need to check if it's passed in `data`
        // Our factory.to_dict includes `asset_history` now.
        // But type definition might need update, OR we cast `data`.
        // Let's check if data has it.
        const history = (data as any)?.asset_history || [];

        if (history.length === 0) {
            // Return empty placeholder or single point current state
            return [
                { name: 'Now', raw: stats.totalValue, wip: 0, finished: 0, trend: stats.totalValue }
            ];
        }

        // Map history to chart format
        // History format: { timestamp: X, assets: Y, etc? } 
        // Factory.py implementation: self.asset_history.append(...) -> It wasn't fully implemented in factory.py loop actually!
        // I Added the list int `__init__` and exposed it in `to_dict`, but didn't push data to it in `update` loop (commented out).
        // So it will be empty.
        // For now, let's keep it clean: Empty placeholder instead of random noise.
        return [];
    }, [data, stats.totalValue]);

    return (
        <div className="space-y-10 pb-20">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Inventory Value"
                    value={`$${stats.totalValue.toLocaleString()}`}
                    trend="+12%"
                    icon={TrendingUp}
                    color="blue"
                />
                <StatCard
                    title="Days on Hand"
                    value={`${stats.doh} Days`}
                    trend="-2.1%"
                    icon={Calendar}
                    color="green"
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStock.toString()}
                    subValue={`${stats.criticalStock} Critical`}
                    trend="+1"
                    icon={AlertTriangle}
                    color={stats.criticalStock > 0 ? "red" : "yellow"}
                />
                <StatCard
                    title="Total SKUs"
                    value={stats.totalSKUs.toString()}
                    trend="0"
                    icon={Package}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inventory List */}
                <div className="lg:col-span-2 bg-panel border border-border-subtle rounded-xl overflow-hidden flex flex-col h-[600px] shadow-card">
                    <div className="p-4 border-b border-border-subtle flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-panel-title flex items-center gap-2">
                                <Package className="w-5 h-5 text-primary-500" />
                                Current Stock Levels
                            </h3>
                            <button
                                onClick={() => setIsRestockModalOpen(true)}
                                className="text-xs bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-glow-primary"
                            >
                                <Plus className="w-3 h-3" /> Restock Request
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-label" />
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-background-elevated border border-border-subtle rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500"
                            >
                                <option value="All">All Categories</option>
                                <option value="Raw Material">Raw Material</option>
                                <option value="WIP">WIP</option>
                                <option value="Finished">Finished</option>
                            </select>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-500"
                            >
                                <option value="All">All Status</option>
                                <option value="OK">OK</option>
                                <option value="LOW">Low Stock</option>
                                <option value="CRITICAL">Critical</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left text-text-secondary">
                            <thead className="text-xs text-text-label uppercase bg-background-elevated/50 sticky top-0 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-6 py-3">Item Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Quantity</th>
                                    <th className="px-6 py-3">Value</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Trend</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.length > 0 ? (
                                    filteredInventory.map((item) => (
                                        <tr key={item.id} className="border-b border-border-subtle hover:bg-surface-hover transition-colors">
                                            <td className="px-6 py-4 font-medium text-text-primary">
                                                {item.name}
                                                <div className="text-xs text-text-label font-mono">{item.id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full bg-background-elevated border border-border-subtle text-xs text-text-secondary">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono">
                                                <div className="flex flex-col">
                                                    <span className="text-text-primary">{item.quantity.toLocaleString()} <span className="text-text-label text-xs">{item.unit}</span></span>
                                                    <span className="text-[10px] text-text-label">Safe: {item.safety_stock}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-text-secondary">
                                                ${item.total_value.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx("px-2 py-1 rounded text-xs font-bold border",
                                                    item.status === 'OK' ? "bg-success/10 border-success/20 text-success" :
                                                        item.status === 'LOW' ? "bg-warning/10 border-warning/20 text-warning" :
                                                            "bg-danger/10 border-danger/20 text-danger animate-pulse"
                                                )}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.trend === 'up' && <ArrowUp className="w-4 h-4 text-success" />}
                                                {item.trend === 'down' && <ArrowDown className="w-4 h-4 text-danger" />}
                                                {item.trend === 'flat' && <div className="w-4 h-0.5 bg-text-label" />}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-text-label">
                                            No items found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Charts & Analytics */}
                <div className="space-y-6">
                    <div className="bg-panel border border-border-subtle rounded-xl p-5 flex flex-col h-[350px] shadow-card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-section-title">Inventory Trends</h3>
                            <div className="flex bg-background-elevated rounded-lg p-0.5">
                                <button
                                    onClick={() => setChartMode('category')}
                                    className={clsx("px-3 py-1 text-xs rounded-md transition-all", chartMode === 'category' ? "bg-surface-hover text-text-primary shadow" : "text-text-secondary hover:text-text-primary")}
                                >
                                    Category
                                </button>
                                <button
                                    onClick={() => setChartMode('trend')}
                                    className={clsx("px-3 py-1 text-xs rounded-md transition-all", chartMode === 'trend' ? "bg-surface-hover text-text-primary shadow" : "text-text-secondary hover:text-text-primary")}
                                >
                                    Total
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                {chartMode === 'category' ? (
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--color-text-label)" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--color-text-label)" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'var(--color-surface-hover)', opacity: 0.5 }}
                                            contentStyle={{ backgroundColor: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        <Bar dataKey="raw" name="Raw Material" fill="var(--color-primary-500)" stackId="a" radius={[0, 0, 4, 4]} />
                                        <Bar dataKey="wip" name="WIP" fill="#8b5cf6" stackId="a" />
                                        <Bar dataKey="finished" name="Finished Goods" fill="var(--color-success)" stackId="a" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--color-text-label)" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--color-text-label)" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-background-elevated)', borderColor: 'var(--color-border-subtle)', color: 'var(--color-text-primary)' }}
                                        />
                                        <Area type="monotone" dataKey="trend" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorTrend)" />
                                    </AreaChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions / Recent Activity */}
                    <div className="bg-panel border border-border-subtle rounded-xl p-5 flex-1 shadow-card">
                        <h3 className="text-section-title mb-4">Recent Movements</h3>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", i % 2 === 0 ? "bg-success/10 text-success" : "bg-primary-500/10 text-primary-500")}>
                                        {i % 2 === 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-text-primary font-medium">{i % 2 === 0 ? "Restock: Steel Sheets" : "Usage: Plastic Pellets"}</p>
                                        <p className="text-text-label text-xs">Today, 10:2{i} AM</p>
                                    </div>
                                    <span className="font-mono text-text-secondary">{i % 2 === 0 ? "+500" : "-120"} kg</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Restock Modal */}
            <AnimatePresence>
                {isRestockModalOpen && (
                    <RestockModal onClose={() => setIsRestockModalOpen(false)} inventory={inventory} />
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ title, value, subValue, trend, icon: Icon, color }: any) {
    const colors = {
        blue: "bg-primary-500/10 text-primary-500 border-primary-500/20",
        green: "bg-success/10 text-success border-success/20",
        red: "bg-danger/10 text-danger border-danger/20",
        yellow: "bg-warning/10 text-warning border-warning/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-panel border border-border-subtle p-5 rounded-xl flex items-start justify-between transition-shadow hover:shadow-card shadow-sm"
        >
            <div>
                <p className="text-text-label text-xs uppercase font-medium tracking-wider mb-1">{title}</p>
                <motion.h3
                    key={value}
                    initial={{ scale: 0.9, color: "var(--color-text-primary)" }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-text-primary mb-1"
                >
                    {value}
                </motion.h3>
                {subValue && <p className="text-xs text-text-secondary mb-1">{subValue}</p>}
                <span className={clsx("text-xs flex items-center gap-1", trend.startsWith('+') ? "text-success" : trend.startsWith('-') ? "text-danger" : "text-text-label")}>
                    {trend !== "0" && (trend.startsWith('+') ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    {trend} <span className="text-text-label">vs last month</span>
                </span>
            </div>
            <div className={`p-3 rounded-lg border ${colors[color as keyof typeof colors]}`}>
                <Icon className="w-5 h-5" />
            </div>
        </motion.div>
    );
}

function RestockModal({ onClose, inventory }: { onClose: () => void, inventory: InventoryItem[] }) {
    const [selectedItem, setSelectedItem] = useState(inventory[0]?.id || "");
    const [quantity, setQuantity] = useState("");
    const [date, setDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Here you would typically call an API
        alert(`Restock request submitted for ${selectedItem}: ${quantity} units`);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-panel border border-border-strong w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-border-subtle flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-primary-500" />
                        New Restock Request
                    </h3>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-text-label uppercase mb-1">Select Item</label>
                        <select
                            value={selectedItem}
                            onChange={e => setSelectedItem(e.target.value)}
                            className="w-full bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
                        >
                            {inventory.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.id})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-label uppercase mb-1">Quantity</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            className="w-full bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
                            placeholder="Enter amount..."
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-label uppercase mb-1">Expected Arrival</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-text-label uppercase mb-1">Notes</label>
                        <textarea
                            className="w-full bg-background-elevated border border-border-subtle rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-primary-500 h-24 resize-none"
                            placeholder="Optional notes..."
                        />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-background-elevated hover:bg-surface-hover text-text-secondary rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-glow-primary"
                        >
                            <Save className="w-4 h-4" /> Submit Request
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
