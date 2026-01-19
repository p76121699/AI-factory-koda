import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { FactoryData, Machine, PanelType, Alert, AlertFilterOptions } from '../types/factory';

interface FactoryContextType {
    data: FactoryData | null;
    connected: boolean;
    activePanel: PanelType;
    setActivePanel: (panel: PanelType) => void;
    selectedMachine: Machine | null;
    setSelectedMachine: (machine: Machine | null) => void;
    alerts: Alert[];
    addAlert: (alert: Alert) => void;
    clearAlert: (id: string) => void;
    clearAllAlerts: () => void;
    filterOptions: AlertFilterOptions;
    setFilterOptions: (o: AlertFilterOptions) => void;
    controlMachine: (id: string, command: 'start' | 'stop' | 'reset') => Promise<void>;
    apiUrl: string; // [NEW] Expose constructed URL
    financials: { revenue: number; costs: number; profit: number } | null;
    chatMessages: { role: string, content: string, actions?: string[], isLoading?: boolean }[];
    addChatMessage: (msg: { role: string, content: string, actions?: string[], isLoading?: boolean }) => void;
    setChatMessages: React.Dispatch<React.SetStateAction<{ role: string, content: string, actions?: string[], isLoading?: boolean }[]>>;
    currentState: FactoryData | null; // Added for AIAssistantPanel compatibility
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export function FactoryProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<FactoryData | null>(null);
    const [connected, setConnected] = useState(false);
    const [activePanel, setActivePanel] = useState<PanelType>('dashboard');
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [filterOptions, setFilterOptions] = useState<AlertFilterOptions>({});
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string, actions?: string[], isLoading?: boolean }[]>([
        { role: 'assistant', content: 'Hello! I am your Factory AI Copilot. I can help you monitor machine status, analyze anomalies, or suggest optimizations.', actions: ['Check System Health', 'Show Alerts'] }
    ]);

    const ws = useRef<WebSocket | null>(null);
    const selectedMachineIdRef = useRef<string | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        selectedMachineIdRef.current = selectedMachine?.id || null;
    }, [selectedMachine]);

    // [Smart URL Detection]
    const getBaseUrls = () => {
        // 1. Env Vars (Highest Priority)
        let api = process.env.NEXT_PUBLIC_API_URL;
        let ws_url = process.env.NEXT_PUBLIC_WS_URL;

        // 2. Auto-detect based on browser location (Client-side only)
        if (typeof window !== 'undefined' && !api) {
            const host = window.location.hostname;
            if (host === 'localhost' || host === '127.0.0.1') {
                api = 'http://127.0.0.1:8000';
                ws_url = 'ws://127.0.0.1:8000/ws/realtime';
            } else {
                // Production Fallback (Render)
                api = 'https://ai-factory-koda.onrender.com';
                ws_url = 'wss://ai-factory-koda.onrender.com/ws/realtime';
            }
        }

        // 3. Absolute Fallback (Server-side rendering safe)
        if (!api) api = 'http://127.0.0.1:8000';
        if (!ws_url) ws_url = 'ws://127.0.0.1:8000/ws/realtime';

        return { api, ws_url };
    };

    const { api: apiUrl, ws_url: wsUrl } = getBaseUrls();

    // WebSocket Connection
    useEffect(() => {
        const connect = () => {
            console.log("Attempting to connect to WebSocket...");
            console.log(`[FactoryContext] Connecting to WebSocket: ${wsUrl}`);
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                setConnected(true);
                console.log("Connected to WebSocket");
            };

            ws.current.onmessage = async (event) => {
                try {
                    let jsonString = "";

                    if (event.data instanceof Blob) {
                        // [NEW] Handle Gzip Compressed Data
                        try {
                            // Modern Browser Decompression API
                            const ds = new DecompressionStream('gzip');
                            const decompressedStream = event.data.stream().pipeThrough(ds);
                            const response = new Response(decompressedStream);
                            jsonString = await response.text();
                        } catch (err) {
                            console.error("Decompression failed", err);
                            return;
                        }
                    } else {
                        jsonString = event.data;
                    }

                    const parsed: FactoryData = JSON.parse(jsonString);
                    setData(parsed);

                    // Update selected machine if it exists in the new data
                    const currentId = selectedMachineIdRef.current;
                    if (currentId) {
                        for (const line of parsed.lines) {
                            const m = line.machines.find(m => m.id === currentId);
                            if (m) {
                                setSelectedMachine(m);
                                break;
                            }
                        }
                    }

                    // Sync Alerts from Backend
                    if (parsed.alerts) {
                        setAlerts(prev => {
                            // Backend sends active alerts, so we can trust it.
                            return parsed.alerts;
                        });
                    }

                } catch (e) {
                    console.error("Parse error", e);
                }
            };

            ws.current.onclose = (e) => {
                setConnected(false);
                console.log("WebSocket closed", e);
                setTimeout(connect, 3000);
            };

            ws.current.onerror = (e) => {
                console.error("WebSocket error", e);
            };
        };

        connect();
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    const addAlert = (newAlert: Alert) => {
        setAlerts(prev => [newAlert, ...prev]);
    };

    const clearAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    };

    const clearAllAlerts = () => {
        setAlerts([]);
    };

    const addChatMessage = (msg: { role: string, content: string, actions?: string[], isLoading?: boolean }) => {
        setChatMessages(prev => [...prev, msg]);
    };

    const controlMachine = async (id: string, command: 'start' | 'stop' | 'reset') => {
        try {
            // Use the smart apiUrl detected above
            const response = await fetch(`${apiUrl}/api/v1/machines/${id}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command })
            });
            if (!response.ok) {
                throw new Error('Failed to send command');
            }
            console.log(`Command ${command} sent to ${id}`);
        } catch (error) {
            console.error("Control error:", error);
            addAlert({
                id: Date.now().toString(),
                machineId: id,
                type: 'system',
                severity: 'medium',
                message: `Failed to ${command} machine: ${error}`,
                timestamp: Date.now()
            });
        }
    };

    return (
        <FactoryContext.Provider value={{
            data,
            connected,
            activePanel,
            setActivePanel,
            selectedMachine,
            setSelectedMachine,
            alerts,
            addAlert,
            clearAlert,
            clearAllAlerts,
            filterOptions,
            setFilterOptions,
            controlMachine,
            apiUrl, // [NEW]
            financials: data?.financials || null,
            chatMessages,
            addChatMessage,
            setChatMessages,
            currentState: data // Expose data as currentState for compatibility
        }}>
            {children}
        </FactoryContext.Provider>
    );
}

export function useFactory() {
    const context = useContext(FactoryContext);
    if (context === undefined) {
        throw new Error('useFactory must be used within a FactoryProvider');
    }
    return context;
}
