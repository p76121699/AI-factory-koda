"use client";

import React from 'react';

// ============ ICONS (Text Fallback or Lucide if installed, keeping simple emoji for now) ============
const Icons = {
  Client: "💻",
  Gateway: "🚪",
  Service: "⚙️",
  Bot: "🤖",
  DB: "🗄️",
  Cache: "⚡",
  ArrowRight: "→",
};

// ============ ARCHITECTURE DATA ============
const layers = [
  {
    title: "CLIENT LAYER",
    color: "blue",
    components: [
      {
        id: "frontend",
        name: "Next.js Client",
        desc: "App Router / SSR",
        icon: Icons.Client,
        tech: ["SEO Content", "Zustand Store", "Recharts"],
        port: 3000,
        borderColor: "border-blue-500",
        shadowColor: "shadow-blue-500/20",
      }
    ],
    // Connection to next layer (API)
    connection: {
      protocol: "HTTPS / WSS",
      bandwidth: "~500 B/req",
      details: "User Actions"
    }
  },
  {
    title: "API LAYER",
    color: "green",
    components: [
      {
        id: "gateway",
        name: "FastAPI Gateway",
        desc: "Async Entrypoint",
        icon: Icons.Gateway,
        tech: ["JWT Auth", "Rate Limiting", "Pydantic Validation"],
        port: 8000,
        borderColor: "border-emerald-500",
        shadowColor: "shadow-emerald-500/20",
        connectedTo: ["sim_service", "ai_agent"]
      }
    ],
    // Connection to next layer (Services)
    connection: {
      protocol: "HTTP / WS",
      bandwidth: "~25 KB/s",
      details: "Async Dispatch"
    }
  },
  {
    title: "MICRO-SERVICES",
    color: "purple",
    components: [
      {
        id: "sim_service",
        name: "Simulation Service",
        desc: "Physics Engine",
        icon: Icons.Service,
        tech: ["Factory Physics", "Machine Models", "WebSocket Push (1Hz)"],
        port: 8765,
        borderColor: "border-violet-500",
        shadowColor: "shadow-violet-500/20",
        connectedTo: ["db_primary"]
      },
      {
        id: "ai_agent",
        name: "AI Agent",
        desc: "LLM Orchestrator",
        icon: Icons.Bot,
        tech: ["Gemini 2.0 Flash", "Context Builder", "Event Triggered"],
        port: null,
        borderColor: "border-pink-500",
        shadowColor: "shadow-pink-500/20",
        connectedTo: ["db_primary", "db_cache"]
      }
    ],
    // Connection to next layer (Data)
    connection: {
      protocol: "SQL / TCP",
      bandwidth: "Variable",
      details: "Pool: 20 conn"
    }
  },
  {
    title: "DATA LAYER",
    color: "amber",
    components: [
      {
        id: "db_primary",
        name: "PostgreSQL",
        desc: "Main DB",
        icon: Icons.DB,
        tech: ["Factory State", "User Metadata", "Audit Logs"],
        port: 5432,
        borderColor: "border-amber-500",
        shadowColor: "shadow-amber-500/20",
      },
      {
        id: "db_cache",
        name: "Redis",
        desc: "Cache / Queue",
        icon: Icons.Cache,
        tech: ["Real-time Buffer", "Task Queue", "Session Store"],
        port: 6379,
        borderColor: "border-orange-500",
        shadowColor: "shadow-orange-500/20",
      }
    ]
  }
];

// ============ UI COMPONENTS ============

function BlueprintCard({ comp }: { comp: any }) {
  return (
    <div className={`
      relative group
      bg-gray-900/80 backdrop-blur-md 
      border-l-4 ${comp.borderColor} 
      rounded-r-xl p-5 
      shadow-lg ${comp.shadowColor}
      hover:translate-y-[-2px] transition-all duration-300
      min-w-[240px]
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl bg-gray-800 p-2 rounded-lg">{comp.icon}</span>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{comp.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{comp.desc}</p>
          </div>
        </div>
      </div>

      {/* Tech Specs */}
      <ul className="space-y-1.5 mb-4">
        {comp.tech.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-300">
            <span className={`w-1 h-1 rounded-full bg-current opacity-70 ${comp.borderColor.replace('border-', 'text-')}`}></span>
            {feature}
          </li>
        ))}
      </ul>

      {/* Port Badge */}
      {comp.port && (
        <div className="absolute top-2 right-2">
          <span className="text-[10px] font-mono text-gray-500 bg-gray-950/50 px-1.5 py-0.5 rounded border border-gray-800">
            :{comp.port}
          </span>
        </div>
      )}
    </div>
  );
}

function ConnectionArrow({ label, subLabel, bandwidth }: { label?: string, subLabel?: string, bandwidth?: string }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center mx-4 w-24 opacity-80 group">
      {/* Bandwidth Badge */}
      <div className="mb-1 px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-green-400 font-mono shadow-sm">
        {bandwidth}
      </div>

      {/* Arrow Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-gray-700 via-blue-500 to-gray-700 relative my-1">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-gray-600 border-y-[4px] border-y-transparent"></div>
      </div>

      {/* Main Label */}
      {label && <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{label}</span>}
      {/* Sub Label */}
      {subLabel && <span className="text-[9px] text-gray-500">{subLabel}</span>}
    </div>
  );
}

function LayerColumn({ layer, isLast }: { layer: any, isLast: boolean }) {
  return (
    <div className="flex flex-col md:flex-row items-center">
      {/* The Column Itself */}
      <div className="flex flex-col gap-6">
        {/* Layer Header */}
        <div className="text-center mb-2">
          <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase">{layer.title}</h4>
        </div>

        {/* Components Stack */}
        <div className="flex flex-col gap-6 border-dashed border-gray-800/50 p-4 rounded-2xl bg-gray-900/20">
          {layer.components.map((c: any) => (
            <BlueprintCard key={c.id} comp={c} />
          ))}
        </div>
      </div>

      {/* Connection Arrow to Next Layer */}
      {!isLast && layer.connection && (
        <div className="my-8 md:my-0 md:mx-2 flex items-center justify-center">
          <ConnectionArrow
            label={layer.connection.protocol}
            subLabel={layer.connection.details}
            bandwidth={layer.connection.bandwidth}
          />
          {/* Mobile / Simple Arrow Fallback */}
          <span className="md:hidden text-gray-600 text-xl font-thin transform rotate-90">➜</span>
        </div>
      )}
    </div>
  );
}


// ============ MAIN PAGE ============

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Radial Gradient Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>

      <div className="relative z-10 p-8 md:p-12 max-w-[1600px] mx-auto">

        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4 tracking-tight">
            AI Factory Koda <span className="font-light text-gray-600">Architecture</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            System Flow: Client → Gateway → Microservices → Data
          </p>
        </header>

        {/* Diagram Scroll Container (for mobile) */}
        <div className="overflow-x-auto pb-12">
          <div className="min-w-max flex items-start gap-4 p-4 md:pl-12">
            {layers.map((layer, index) => (
              <LayerColumn
                key={index}
                layer={layer}
                isLast={index === layers.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Legend / Stats Footer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 border-t border-gray-800 pt-8 text-sm text-gray-400">
          <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <span className="text-2xl">⚡</span>
            <div>
              <strong className="text-white block">Real-time Latency</strong>
              1Hz Push (WebSocket)
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <span className="text-2xl">🔒</span>
            <div>
              <strong className="text-white block">Security</strong>
              JWT & Rate Limiting (Gateway)
            </div>
          </div>
          <div className="flex items-center gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <span className="text-2xl">🧠</span>
            <div>
              <strong className="text-white block">AI Interpretation</strong>
              LLM Context Build (~5s)
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
