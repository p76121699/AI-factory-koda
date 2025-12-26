"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

export default function Hero() {
    return (
        <section className="h-screen w-full flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="z-10 text-center px-4"
            >
                <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 text-blue-400 text-sm font-mono mb-4 border border-blue-500/20">
                    AI-POWERED INDUSTRIAL AUTOMATION
                </span>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
                    Smart Factory <br /> Digital Twin
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    A real-time, autonomous manufacturing simulation powered by Generative AI.
                    Experience the future of Industry 4.0.
                </p>

                <a
                    href="http://localhost:3000"
                    target="_blank"
                    className="bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform inline-flex items-center gap-2"
                >
                    Launch Simulation
                </a>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute bottom-10 z-10 animate-bounce"
            >
                <ArrowDown className="text-gray-500" />
            </motion.div>
        </section>
    );
}
