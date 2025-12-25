"use client";

import React from 'react';
import { useFactory } from '../../context/FactoryContext';
import { LayoutDashboard, Package, ShoppingCart, Activity, Bell, Settings, Menu, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { connected, activePanel, setActivePanel, alerts } = useFactory();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'production', label: 'Production', icon: Activity },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'ai-assistant', label: 'AI Assistant', icon: Zap },
    ];

    return (
        <div className="min-h-screen bg-background-base text-text-primary font-sans flex overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 240 }}
                animate={{ width: sidebarOpen ? 240 : 80 }}
                className="bg-panel border-r border-border-subtle flex flex-col z-20 overflow-hidden flex-shrink-0"
            >
                <div className={clsx("flex items-center h-20 border-b border-border-subtle transition-all duration-300",
                    sidebarOpen ? "px-6 gap-3" : "px-0 justify-center"
                )}>
                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-glow-primary">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    {sidebarOpen && (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-sm tracking-tight text-text-primary whitespace-nowrap -ml-1"
                        >
                            SmartFactory
                        </motion.h1>
                    )}
                </div>

                <div className="flex-1 py-6 flex flex-col gap-1 px-3">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActivePanel(item.id as any)}
                            title={!sidebarOpen ? item.label : undefined}
                            className={clsx(
                                "flex items-center rounded-lg transition-all duration-200 group relative",
                                sidebarOpen ? "gap-3 px-3 py-2.5" : "justify-center py-3",
                                activePanel === item.id
                                    ? "bg-primary-600 text-white shadow-glow-primary"
                                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5 flex-shrink-0", activePanel === item.id ? "text-white" : "text-text-label group-hover:text-text-secondary")} />
                            {sidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="font-medium whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                            {!sidebarOpen && activePanel === item.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-border-subtle">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center p-2 text-text-secondary hover:text-text-primary transition-colors hover:bg-surface-hover rounded-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Header */}
                <header className="h-20 border-b border-border-subtle bg-background-base/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div>
                        <h2 className="text-panel-title capitalize">{activePanel}</h2>
                        <p className="text-body-s text-text-label">Real-time Monitoring System</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            connected ? 'bg-success/10 text-success border-success/20' : 'bg-danger/10 text-danger border-danger/20'
                        )}>
                            <div className={clsx("w-2 h-2 rounded-full", connected ? 'bg-success animate-pulse' : 'bg-danger')} />
                            {connected ? "SYSTEM ONLINE" : "DISCONNECTED"}
                        </div>

                        <button
                            onClick={() => setActivePanel('alerts')}
                            className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {alerts.filter(a => !a.resolved).length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger rounded-full border border-background-base flex items-center justify-center text-[10px] font-bold text-white px-1">
                                    {alerts.filter(a => !a.resolved).length > 99 ? '99+' : alerts.filter(a => !a.resolved).length}
                                </span>
                            )}
                        </button>

                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-primary-600 border border-border-subtle shadow-glow-primary" />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePanel}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
