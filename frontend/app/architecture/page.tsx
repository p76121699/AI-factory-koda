"use client";

import React from 'react';

// ============ ARCHITECTURE DATA ============
const components = [
  {
    id: 'simulation',
    name: 'Simulation Engine',
    tech: 'Python FastAPI + WebSocket',
    port: 8765,
    color: 'from-emerald-500 to-teal-600',
    icon: '⚙️',
    modules: [
      { name: 'Factory', desc: 'Physics engine for machines, workers, orders' },
      { name: 'Models', desc: 'Cutter, Conveyor, RobotArm, Inspector, Packer' },
      { name: 'Config', desc: 'Thresholds, costs, recipes' },
    ],
    dataOut: '~20 KB/msg (Full factory state JSON)',
  },
  {
    id: 'backend',
    name: 'Backend API',
    tech: 'Python FastAPI + WebSocket',
    port: 8000,
    color: 'from-blue-500 to-indigo-600',
    icon: '🖥️',
    modules: [
      { name: 'DataBridge', desc: 'Core orchestrator, WS client to Sim' },
      { name: 'AICollaborator', desc: 'Gemini / Ollama integration' },
      { name: 'AnomalyDetector', desc: 'Threshold-based alert detection' },
      { name: 'Database', desc: 'SQLite (dev) / PostgreSQL (prod)' },
    ],
    dataOut: '~25 KB/msg (Enriched data + alerts)',
  },
  {
    id: 'frontend',
    name: 'Frontend Dashboard',
    tech: 'Next.js 14 + React + Tailwind',
    port: 3000,
    color: 'from-violet-500 to-purple-600',
    icon: '🌐',
    modules: [
      { name: 'Dashboard', desc: 'Real-time machine cards, charts' },
      { name: 'Panels', desc: 'Orders, Alerts, AI Assistant, Inventory' },
      { name: 'Context', desc: 'FactoryContext (global state via WS)' },
    ],
    dataOut: 'User commands (~100 B)',
  },
  {
    id: 'database',
    name: 'Database',
    tech: 'SQLite / PostgreSQL',
    port: null,
    color: 'from-amber-500 to-orange-600',
    icon: '🗄️',
    modules: [
      { name: 'Event', desc: 'Historical anomaly/alert logs' },
      { name: 'MachineState', desc: 'Snapshot of machine metrics' },
    ],
    dataOut: 'Persistent storage',
  },
  {
    id: 'ai',
    name: 'AI Service',
    tech: 'Google Gemini / Ollama (Fallback)',
    port: null,
    color: 'from-pink-500 to-rose-600',
    icon: '🤖',
    modules: [
      { name: 'Chat', desc: 'Natural language commands' },
      { name: 'Autonomy', desc: 'Auto-optimization decisions' },
      { name: 'Analysis', desc: 'Anomaly root cause analysis' },
    ],
    dataOut: '~1-2 KB/response (JSON)',
  },
];

const connections = [
  {
    from: 'simulation',
    to: 'backend',
    label: 'Factory State (JSON)',
    protocol: 'WebSocket',
    direction: 'Push',
    frequency: '1 Hz',
    bandwidth: '~20 KB/s',
    color: 'border-emerald-400',
  },
  {
    from: 'backend',
    to: 'simulation',
    label: 'Control Commands',
    protocol: 'WebSocket',
    direction: 'On-Demand',
    frequency: 'Sparse',
    bandwidth: '~100 B/cmd',
    color: 'border-blue-400',
  },
  {
    from: 'backend',
    to: 'frontend',
    label: 'Enriched Data + Alerts',
    protocol: 'WebSocket',
    direction: 'Push',
    frequency: '1 Hz',
    bandwidth: '~25 KB/s',
    color: 'border-blue-400',
  },
  {
    from: 'frontend',
    to: 'backend',
    label: 'User Actions / Chat',
    protocol: 'WS + HTTP',
    direction: 'On-Demand',
    frequency: 'User-triggered',
    bandwidth: '~500 B/req',
    color: 'border-violet-400',
  },
  {
    from: 'backend',
    to: 'database',
    label: 'Events & State',
    protocol: 'SQLAlchemy',
    direction: 'Read/Write',
    frequency: 'On Event',
    bandwidth: 'Variable',
    color: 'border-amber-400',
  },
  {
    from: 'backend',
    to: 'ai',
    label: 'Prompt + Context',
    protocol: 'HTTPS',
    direction: 'Request/Response',
    frequency: 'On Autonomy Tick (~10s)',
    bandwidth: '~5 KB/req, ~2 KB/res',
    color: 'border-pink-400',
  },
];

// ============ COMPONENTS ============

function ComponentCard({ component }: { component: typeof components[0] }) {
  return (
    <div className={`relative bg-gradient-to-br ${component.color} p-1 rounded-2xl shadow-xl`}>
      <div className="bg-gray-900 rounded-xl p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{component.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{component.name}</h3>
            <p className="text-xs text-gray-400">{component.tech}</p>
          </div>
          {component.port && (
            <span className="ml-auto bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm font-mono">
              :{component.port}
            </span>
          )}
        </div>
        <div className="space-y-2">
          {component.modules.map((mod, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-3">
              <span className="text-sm font-semibold text-white">{mod.name}</span>
              <p className="text-xs text-gray-400">{mod.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            <span className="text-gray-400 font-medium">Output:</span> {component.dataOut}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConnectionCard({ conn }: { conn: typeof connections[0] }) {
  return (
    <div className={`bg-gray-800/60 backdrop-blur rounded-xl p-4 border-l-4 ${conn.color}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white text-sm">
          {conn.from.toUpperCase()} → {conn.to.toUpperCase()}
        </span>
        <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
          {conn.protocol}
        </span>
      </div>
      <p className="text-gray-300 text-sm mb-2">{conn.label}</p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded">
          📡 {conn.direction}
        </span>
        <span className="bg-gray-700/50 text-gray-400 px-2 py-1 rounded">
          ⏱️ {conn.frequency}
        </span>
        <span className="bg-gray-700/50 text-green-400 px-2 py-1 rounded font-mono">
          📊 {conn.bandwidth}
        </span>
      </div>
    </div>
  );
}

// ============ MAIN PAGE ============

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          AI-Driven Smart Factory
        </h1>
        <p className="text-gray-400 text-lg">System Architecture Overview</p>
      </header>

      {/* Main Components Grid */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
          <span className="w-8 h-1 bg-blue-500 rounded"></span>
          Core Components
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.slice(0, 3).map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
          {components.slice(3).map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      </section>

      {/* Data Flow Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
          <span className="w-8 h-1 bg-purple-500 rounded"></span>
          Data Flow & Bandwidth
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn, i) => (
            <ConnectionCard key={i} conn={conn} />
          ))}
        </div>
      </section>

      {/* Architecture Diagram (Visual Cards + Arrows) */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
          <span className="w-8 h-1 bg-green-500 rounded"></span>
          Connection Diagram
        </h2>
        <div className="bg-gray-900 rounded-2xl p-8 overflow-x-auto">
          {/* Visual Diagram Container */}
          <div className="relative min-w-[900px] h-[600px]">

            {/* ===== MINI CARDS ===== */}

            {/* AI Service - Top Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48">
              <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-0.5 rounded-xl">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <span className="text-2xl">🤖</span>
                  <h4 className="font-bold text-white text-sm mt-1">AI Service</h4>
                  <p className="text-xs text-gray-400">Gemini / Ollama</p>
                  <span className="inline-block mt-2 bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded text-xs">HTTPS</span>
                </div>
              </div>
            </div>

            {/* Simulation - Left */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 w-48">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 rounded-xl">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <span className="text-2xl">⚙️</span>
                  <h4 className="font-bold text-white text-sm mt-1">Simulation</h4>
                  <p className="text-xs text-gray-400">:8765 · FastAPI</p>
                  <span className="inline-block mt-2 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-xs">WebSocket</span>
                </div>
              </div>
            </div>

            {/* Backend - Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 rounded-xl shadow-lg shadow-blue-500/20">
                <div className="bg-gray-900 rounded-lg p-5 text-center">
                  <span className="text-3xl">🖥️</span>
                  <h4 className="font-bold text-white text-lg mt-1">Backend</h4>
                  <p className="text-xs text-gray-400">:8000 · Core Hub</p>
                  <div className="flex justify-center gap-1 mt-2">
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">WS</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">HTTP</span>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs">SQL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Frontend - Right */}
            <div className="absolute top-1/2 right-4 -translate-y-1/2 w-48">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 rounded-xl">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <span className="text-2xl">🌐</span>
                  <h4 className="font-bold text-white text-sm mt-1">Frontend</h4>
                  <p className="text-xs text-gray-400">:3000 · Next.js</p>
                  <span className="inline-block mt-2 bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded text-xs">React</span>
                </div>
              </div>
            </div>

            {/* Database - Bottom Center */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-0.5 rounded-xl">
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <span className="text-2xl">🗄️</span>
                  <h4 className="font-bold text-white text-sm mt-1">Database</h4>
                  <p className="text-xs text-gray-400">SQLite / PostgreSQL</p>
                  <span className="inline-block mt-2 bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-xs">SQLAlchemy</span>
                </div>
              </div>
            </div>

            {/* ===== ARROWS WITH BANDWIDTH ===== */}

            {/* AI ↔ Backend (Vertical) */}
            <div className="absolute top-[110px] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-0.5 h-16 bg-gradient-to-b from-pink-500 to-blue-500"></div>
              <div className="absolute top-1/2 -translate-y-1/2 -right-24 bg-gray-800 border border-pink-500/30 rounded px-2 py-1">
                <p className="text-xs text-pink-300 font-mono">~5KB↓ 2KB↑</p>
                <p className="text-[10px] text-gray-500">~10s cycle</p>
              </div>
              {/* Arrows */}
              <div className="absolute top-0 w-2 h-2 border-l-2 border-b-2 border-pink-400 rotate-45 -translate-y-1"></div>
              <div className="absolute bottom-0 w-2 h-2 border-l-2 border-b-2 border-blue-400 -rotate-[135deg] translate-y-1"></div>
            </div>

            {/* Simulation → Backend */}
            <div className="absolute top-1/2 left-[220px] -translate-y-1/2 flex items-center">
              <div className="w-32 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 border border-emerald-500/30 rounded px-2 py-1 whitespace-nowrap">
                <p className="text-xs text-emerald-300 font-mono">~20 KB/s →</p>
                <p className="text-[10px] text-gray-500">1 Hz Push</p>
              </div>
              {/* Arrow Head */}
              <div className="w-0 h-0 border-l-8 border-l-blue-400 border-y-4 border-y-transparent"></div>
            </div>

            {/* Backend → Simulation (below) */}
            <div className="absolute top-[55%] left-[220px] flex items-center">
              <div className="w-0 h-0 border-r-8 border-r-emerald-400 border-y-4 border-y-transparent"></div>
              <div className="w-32 h-0.5 bg-gradient-to-l from-emerald-500 to-blue-500"></div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-blue-500/30 rounded px-2 py-1 whitespace-nowrap">
                <p className="text-xs text-blue-300 font-mono">← ~100 B</p>
                <p className="text-[10px] text-gray-500">Commands</p>
              </div>
            </div>

            {/* Backend → Frontend */}
            <div className="absolute top-1/2 right-[220px] -translate-y-1/2 flex items-center">
              <div className="w-32 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500"></div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 border border-blue-500/30 rounded px-2 py-1 whitespace-nowrap">
                <p className="text-xs text-blue-300 font-mono">~25 KB/s →</p>
                <p className="text-[10px] text-gray-500">1 Hz Push</p>
              </div>
              {/* Arrow Head */}
              <div className="w-0 h-0 border-l-8 border-l-violet-400 border-y-4 border-y-transparent"></div>
            </div>

            {/* Frontend → Backend (below) */}
            <div className="absolute top-[55%] right-[220px] flex items-center">
              <div className="w-0 h-0 border-r-8 border-r-blue-400 border-y-4 border-y-transparent"></div>
              <div className="w-32 h-0.5 bg-gradient-to-l from-blue-500 to-violet-500"></div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-800 border border-violet-500/30 rounded px-2 py-1 whitespace-nowrap">
                <p className="text-xs text-violet-300 font-mono">← ~500 B</p>
                <p className="text-[10px] text-gray-500">User Actions</p>
              </div>
            </div>

            {/* Backend → Database (Vertical) */}
            <div className="absolute bottom-[110px] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-0.5 h-16 bg-gradient-to-b from-blue-500 to-amber-500"></div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-24 bg-gray-800 border border-amber-500/30 rounded px-2 py-1">
                <p className="text-xs text-amber-300 font-mono">R/W</p>
                <p className="text-[10px] text-gray-500">On Event</p>
              </div>
              {/* Arrows (bidirectional) */}
              <div className="absolute top-0 w-2 h-2 border-l-2 border-b-2 border-blue-400 rotate-45 -translate-y-1"></div>
              <div className="absolute bottom-0 w-2 h-2 border-l-2 border-b-2 border-amber-400 -rotate-[135deg] translate-y-1"></div>
            </div>

          </div>

          {/* Bandwidth Legend */}
          <div className="mt-8 border-t border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">📊 Bandwidth Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-emerald-400">Sim → Backend</span>
                <p className="text-white font-mono mt-1">~20 KB/s</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-blue-400">Backend → Frontend</span>
                <p className="text-white font-mono mt-1">~25 KB/s</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-pink-400">Backend ↔ AI</span>
                <p className="text-white font-mono mt-1">~5KB / ~2KB</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-violet-400">User Commands</span>
                <p className="text-white font-mono mt-1">~100-500 B</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Summary */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-200 mb-6 flex items-center gap-2">
          <span className="w-8 h-1 bg-amber-500 rounded"></span>
          Technology Stack
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Python', version: '3.11+', icon: '🐍' },
            { name: 'FastAPI', version: '0.100+', icon: '⚡' },
            { name: 'Next.js', version: '14', icon: '▲' },
            { name: 'React', version: '18', icon: '⚛️' },
            { name: 'TailwindCSS', version: '3.4', icon: '🎨' },
            { name: 'SQLAlchemy', version: '2.0', icon: '💾' },
            { name: 'WebSocket', version: 'RFC 6455', icon: '🔌' },
            { name: 'Gemini AI', version: '2.0 Flash', icon: '✨' },
          ].map((tech, i) => (
            <div key={i} className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">{tech.icon}</span>
              <div>
                <p className="font-semibold text-white">{tech.name}</p>
                <p className="text-xs text-gray-400">{tech.version}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>AI-Driven Smart Factory Digital Twin System</p>
        <p className="text-xs mt-1">Architecture Diagram v1.0</p>
      </footer>
    </div>
  );
}
