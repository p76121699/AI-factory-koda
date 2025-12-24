"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Clock, CheckCircle, AlertCircle, Truck, Search, Filter, Plus, X, Calendar, MoreVertical, ChevronRight } from 'lucide-react';
import { FactoryData, OrderModel } from '../../types/factory';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useFactory } from '../../context/FactoryContext';



export default function OrdersPanel() {
    const { data, connected } = useFactory();
    const orders = data?.orders || [];
    const financials = data?.financials;

    // const [orders, setOrders] = useState<OrderModel[]>([]); // Removed local state
    // Loading state is now effectively "not connected" or "no data yet"
    const loading = !data && !connected;

    // const [loading, setLoading] = useState(true); // Removed
    // const [error, setError] = useState<string | null>(null); // Removed
    const [searchKeyword, setSearchKeyword] = useState("");
    const [sortKey, setSortKey] = useState<'due' | 'progress' | 'quantity' | 'status'>('due');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Removed fetchOrders and useEffect - data comes from WebSocket context automatically

    const handleCreateOrder = async (newOrder: Partial<OrderModel>) => {
        // In a real app, we would POST to an API to create the order.
        // For this simulation, since there's no POST /orders endpoint yet, 
        // we can either mock it or add it.
        // But the user requested "Connecting to Frontend", and simulation factory.py has orders[]
        // However, factory.py creates random orders. It doesn't listen to a CREATE event yet via API/Websocket.
        // For now, let's keep the mock API call BUT it won't actually update the server state unless we implement a backend endpoint.
        // Wait, to keep it simple and working: we can just "simulate" the order creation on the server side?
        // Actually, the `mockApi` was removed. 
        // Let's implement a POST request to backend later if needed.
        // For now, just close modal and alert "Coming Soon" or similar?
        // OR: Since the user wants "Game", maybe we just trust the simulation generates orders?
        // Let's re-add a placeholder handler.
        alert("Order creation API not yet implemented in backend simulation. This feature will come in next update.");
        setIsCreateModalOpen(false);
    };

    // Filtering & Sorting
    const filteredOrders = useMemo(() => {
        let result = orders.filter(order =>
            order.customer.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            order.product.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            order.id.toLowerCase().includes(searchKeyword.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortKey === 'due') return new Date(a.due).getTime() - new Date(b.due).getTime();
            if (sortKey === 'progress') return b.progress - a.progress;
            if (sortKey === 'quantity') return b.quantity - a.quantity;
            if (sortKey === 'status') return a.status.localeCompare(b.status);
            return 0;
        });

        return result;
    }, [orders, searchKeyword, sortKey]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Actions */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Active Orders</h2>
                        <p className="text-gray-400 text-sm">Real-time simulation orders and revenue</p>
                    </div>
                    {/* Financial Stats Bar (New) */}
                    {financials && (
                        <div className="flex gap-4 bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                            <div className="text-center px-2">
                                <div className="text-[10px] text-gray-500 uppercase">Revenue</div>
                                <div className="text-green-400 font-mono font-bold">${financials.revenue.toLocaleString()}</div>
                            </div>
                            <div className="w-px bg-gray-800"></div>
                            <div className="text-center px-2">
                                <div className="text-[10px] text-gray-500 uppercase">Costs</div>
                                <div className="text-red-400 font-mono font-bold">${financials.costs.toLocaleString()}</div>
                            </div>
                            <div className="w-px bg-gray-800"></div>
                            <div className="text-center px-2">
                                <div className="text-[10px] text-gray-500 uppercase">Profit</div>
                                <div className={clsx("font-mono font-bold", financials.profit >= 0 ? "text-blue-400" : "text-red-500")}>
                                    ${financials.profit.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* 
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> New Order
                    </button>
                    */}
                </div>
            </div>

            {/* Search & Sort Bar */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search orders by ID, Customer, or Product..."
                        value={searchKeyword}
                        onChange={e => setSearchKeyword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                        value={sortKey}
                        onChange={e => setSortKey(e.target.value as any)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                    >
                        <option value="due">Due Date</option>
                        <option value="progress">Progress</option>
                        <option value="quantity">Quantity</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            {/* Order List */}
            <div className="space-y-4">
                {loading ? (
                    // Skeleton Loader
                    [1, 2, 3].map(i => (
                        <div key={i} className="bg-gray-900 border border-gray-800 p-5 rounded-xl animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-800 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-gray-800 rounded w-1/3" />
                                    <div className="h-3 bg-gray-800 rounded w-1/4" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No matching orders found.
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))
                )}
            </div>

            {/* Create Order Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateOrderModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateOrder}
                        loading={loading}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function OrderCard({ order }: { order: OrderModel }) {
    const { data } = useFactory();
    const producingLine = data?.lines.find(l => l.product_type === order.product);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 border border-gray-800 p-4 rounded-xl grid grid-cols-12 gap-4 items-center hover:border-gray-700 transition-colors group"
        >
            {/* Customer & Product Info (Col 1-4) */}
            <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                    order.status === 'Ready' ? 'bg-green-900/20 text-green-400' :
                        order.status === 'Pending' ? 'bg-gray-800 text-gray-400' :
                            'bg-blue-900/20 text-blue-400'
                )}>
                    {order.status === 'Ready' ? <Truck className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-200 truncate">{order.customer}</h3>
                        {order.priority === 'High' && <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[10px] uppercase font-bold rounded border border-red-800 shrink-0">High</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{order.id} • {order.product}</p>
                    {/* [FIX] Use Backend-provided description for accurate Line info (Load Balancing) */}
                    {(order as any).description && (
                        <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            {(order as any).description}
                        </p>
                    )}
                </div>
            </div>

            {/* Progress Bar (Col 5-7) */}
            <div className="col-span-12 md:col-span-3 flex flex-col justify-center">
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gray-200 font-mono">{order.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={clsx("h-full rounded-full transition-all duration-1000",
                            order.status === 'Ready' ? 'bg-green-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${order.progress}%` }}
                    />
                </div>
            </div>

            {/* Stats (Col 8-10) */}
            <div className="col-span-6 md:col-span-3 flex items-center justify-around">
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Quantity</p>
                    <p className="font-mono font-medium text-gray-200">{order.quantity}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Due Date</p>
                    <p className={clsx("font-mono font-medium",
                        new Date(order.due) < new Date() ? 'text-red-400' : 'text-gray-200'
                    )}>{order.due}</p>
                </div>
            </div>

            {/* Status Button (Col 11-12) */}
            <div className="col-span-6 md:col-span-2 flex justify-end">
                <div className={clsx("px-3 py-1 rounded-full text-xs font-bold border min-w-[90px] text-center",
                    order.status === 'Ready' ? 'bg-green-900/30 text-green-400 border-green-800' :
                        order.status === 'Pending' ? 'bg-gray-800 text-gray-400 border-gray-700' :
                            'bg-blue-900/30 text-blue-400 border-blue-800'
                )}>
                    {order.status}
                </div>
            </div>
        </motion.div>
    );
}

function CreateOrderModal({ onClose, onSubmit, loading }: { onClose: () => void, onSubmit: (data: any) => void, loading: boolean }) {
    const [formData, setFormData] = useState({
        customer: '',
        product: 'Smart Watch X1',
        quantity: 500,
        due: '',
        priority: 'Medium'
    });
    const [error, setError] = useState<string | null>(null);

    const productOptions = [
        "Smart Watch X1",
        "Smart Watch Pro",
        "GPS Tracker",
        "Sensor Module",
        "Hub V2",
        "Industrial Controller"
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.customer.trim()) {
            setError("Customer name is required");
            return;
        }
        if (formData.quantity <= 0 || isNaN(formData.quantity)) {
            setError("Quantity must be a positive number");
            return;
        }
        if (!formData.due) {
            setError("Due date is required");
            return;
        }

        onSubmit(formData);
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
                className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="p-5 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Create New Order</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/20 text-red-400 px-6 py-2 text-sm border-b border-red-900/30 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Customer Name</label>
                        <input
                            type="text"
                            required
                            value={formData.customer}
                            onChange={e => setFormData({ ...formData, customer: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. TechCorp Inc."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Product</label>
                        <select
                            value={formData.product}
                            onChange={e => setFormData({ ...formData, product: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        >
                            {productOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Quantity</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Priority</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 uppercase mb-1">Due Date</label>
                        <input
                            type="date"
                            required
                            value={formData.due}
                            onChange={e => setFormData({ ...formData, due: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? "Creating..." : "Create Order"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
