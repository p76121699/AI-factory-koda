"use client";

import { motion } from "framer-motion";
import { Code2, Database, Layout, Server, Cpu, Brain } from "lucide-react";

const techs = [
    { name: "Next.js 16", icon: Layout, category: "Frontend", desc: "High-performance React Framework" },
    { name: "FastAPI", icon: Server, category: "Backend", desc: "Async Python API with WebSockets" },
    { name: "Gemini 2.0", icon: Brain, category: "AI", desc: "Multimodal LLM for autonomy" },
    { name: "Python Sim", icon: Cpu, category: "Core", desc: "Custom event-driven simulation engine" },
    { name: "Tailwind CSS", icon: Code2, category: "Styling", desc: "Utility-first design system" },
    { name: "SQLAlchemy", icon: Database, category: "Data", desc: "Robust ORM for persistence" },
];

export default function TechStack() {
    return (
        <section className="py-24 bg-black text-white border-t border-gray-900">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-3xl font-bold mb-4">Technology Stack</h2>
                    <p className="text-gray-400">Built with modern, scalable, and high-performance tools.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {techs.map((tech, i) => (
                        <motion.div
                            key={tech.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            <div className="w-12 h-12 bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                                <tech.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{tech.name}</h3>
                            <p className="text-sm text-gray-500 mb-1">{tech.category}</p>
                            <p className="text-gray-400 text-sm">{tech.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
