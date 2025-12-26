import React, { useState } from 'react';
import { useFactory } from '../../context/FactoryContext';

export default function AIAssistantPanel() {
    const { currentState, activePanel } = useFactory();
    const [resetting, setResetting] = useState(false);
    const [autonomyEnabled, setLocalAutonomy] = useState(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    // Sync with Backend on Mount
    React.useEffect(() => {
        fetch(`${apiUrl}/api/autonomy`)
            .then(res => res.json())
            .then(data => setLocalAutonomy(data.enabled))
            .catch(err => console.error("Failed to fetch autonomy status:", err));
    }, []);

    // Also sync if valid data comes in stream (optional, but good for multi-client)
    React.useEffect(() => {
        if (currentState?.autonomy_enabled !== undefined) {
            setLocalAutonomy(currentState.autonomy_enabled);
        }
    }, [currentState?.autonomy_enabled]);

    const toggleAutonomy = async () => {
        const newState = !autonomyEnabled;
        setLocalAutonomy(newState); // Optimistic update

        try {
            await fetch(`${apiUrl}/api/autonomy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            });
        } catch (e) {
            console.error("Failed to set autonomy:", e);
            setLocalAutonomy(!newState); // Revert
        }
    };

    const handleReset = async () => {
        if (!window.confirm("WARNING: This will wipe all database records and reset the simulation. Are you sure?")) return;

        setResetting(true);
        try {
            const res = await fetch(`${apiUrl}/api/reset`, { method: 'POST' });
            if (res.ok) {
                alert("Factory Reset Successful. The system is rebooting...");
                window.location.reload();
            } else {
                alert("Reset Failed.");
            }
        } catch (e) {
            alert("Error connecting to server.");
        } finally {
            setResetting(false);
        }
    };

    const metrics = currentState?.kpi || {
        energy_usage: 0,
        defect_rate: 0,
        avg_efficiency: 0
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6 overflow-y-auto">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">AI Assistant & Control</h1>
                <p className="text-gray-400">Manage factory autonomy and system overrides</p>
            </header>

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Autonomy Status */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Autonomy System</h2>
                            <p className="text-sm text-gray-400 mt-1">
                                {autonomyEnabled ? "AI is actively optimizing production" : "AI is in passive monitoring mode"}
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${autonomyEnabled ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                            {autonomyEnabled ? 'ACTIVE' : 'PAUSED'}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={autonomyEnabled} onChange={toggleAutonomy} />
                                <div className={`block w-14 h-8 rounded-full transition-colors ${autonomyEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                                <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${autonomyEnabled ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                            <span className="ml-3 text-white font-medium">Enable Autonomy</span>
                        </label>
                    </div>
                </div>

                {/* Recent Insights */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-4">Real-time Insights</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <span className="text-gray-400">Energy Efficiency</span>
                            <span className="text-blue-400 font-mono">{(metrics.energy_usage / 1000).toFixed(1)} MWh</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                            <span className="text-gray-400">Defect Rate</span>
                            <span className={`${metrics.defect_rate > 5 ? 'text-red-400' : 'text-green-400'} font-mono`}>
                                {metrics.defect_rate}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-auto pt-10">
                <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6">
                    <h3 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                        ⚠️ Danger Zone
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                        These actions are irreversible. Performing a factory reset will wipe all database records,
                        clear all inventory, and restart the simulation from day zero.
                    </p>

                    <button
                        onClick={handleReset}
                        disabled={resetting}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {resetting ? 'Resetting...' : '⚠️ Factory Reset'}
                    </button>
                </div>
            </div>
        </div>
    );
}
