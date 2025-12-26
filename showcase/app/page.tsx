import Hero from "@/components/Hero";
import TechStack from "@/components/TechStack";
import StarSection from "@/components/StarSection";
import { Activity, Zap, CheckCircle2, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <main className="bg-black min-h-screen text-white selection:bg-blue-500/30">
      <Hero />

      <TechStack />

      {/* S: Situation */}
      <StarSection
        type="S"
        title="The Industrial Blindspot"
        content={[
          "Modern manufacturing facilities generate terabytes of data daily, yet most of it remains siloed in legacy PLCs and spreadsheets.",
          "Operators lack real-time visibility into machine health, leading to reactive maintenance, unexpected downtime, and inefficient energy usage.",
          "The challenge was to create a system that not only monitors but understands and acts on this data instantly."
        ]}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <Activity className="w-24 h-24 text-yellow-500 mb-4 animate-pulse" />
          <h3 className="text-2xl font-bold text-gray-300">Reactive Maintenance</h3>
          <p className="text-gray-500">Downtime costs $20k/hour</p>
        </div>
      </StarSection>

      {/* T: Task */}
      <StarSection
        type="T"
        title="Building the Digital Twin"
        align="right"
        content={[
          "Our objective was to architect a comprehensive Smart Factory prototype that mirrors real-world physics and logistics.",
          "Key requirements included continuous inventory tracking, dynamic order routing, and—most critically—an autonomous AI agent capable of intervening during critical failures.",
          "The system needed to process thousands of events per second with sub-50ms latency to the operator dashboard."
        ]}
      >
        <div className="grid grid-cols-2 gap-4 w-full h-full p-6">
          <div className="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">Real-time Sim</div>
          <div className="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">AI Reasoning</div>
          <div className="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">WebSocket Pipe</div>
          <div className="bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">React Dashboard</div>
        </div>
      </StarSection>

      {/* A: Action */}
      <StarSection
        type="A"
        title="Engineered for Autonomy"
        content={[
          "We developed a custom event-driven Python simulation to generate realistic factory noise, machine wear, and energy consumption patterns.",
          "On the backend, FastAPI handles the high-throughput stream, broadcasting updates via WebSockets to a Next.js frontend optimized with React 19.",
          "The crown jewel is the Gemini 2.0 integration: a context-aware agent that parses error logs and executes recovery protocols without human input."
        ]}
      >
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
            <Zap className="w-32 h-32 text-blue-400 relative z-10" />
          </div>
        </div>
      </StarSection>

      {/* R: Result */}
      <StarSection
        type="R"
        title="Efficiency Reimagined"
        align="right"
        content={[
          "The result is a self-healing manufacturing ecosystem. The AI Agent successfully predicts and prevents 40% of simulated failures.",
          "Operators now have a 'God-view' of the floor, with real-time energy metrics enabling immediate cost-saving decisions.",
          "The project demonstrates that Large Language Models can effectively move beyond chat windows to control physical industrial processes."
        ]}
      >
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
          <div className="flex items-center justify-between p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <span className="text-green-400 font-bold flex gap-2"><CheckCircle2 /> Uptime</span>
            <span className="text-white font-mono">99.9%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <span className="text-blue-400 font-bold flex gap-2"><TrendingUp /> Efficiency</span>
            <span className="text-white font-mono">+25%</span>
          </div>
        </div>
      </StarSection>

      <footer className="py-12 text-center text-gray-600 text-sm">
        <p>Smart Factory Project Showcase • 2024</p>
      </footer>
    </main>
  );
}
