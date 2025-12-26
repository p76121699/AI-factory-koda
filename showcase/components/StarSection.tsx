"use client";

import { motion } from "framer-motion";
import { clsx } from "clsx";

interface StarProps {
    type: "S" | "T" | "A" | "R";
    title: string;
    content: string[];
    align?: "left" | "right";
    children?: React.ReactNode;
}

export default function StarSection({ type, title, content, align = "left", children }: StarProps) {
    const isLeft = align === "left";

    const labels = {
        S: "Situation",
        T: "Task",
        A: "Action",
        R: "Result"
    };

    const colors = {
        S: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        T: "text-blue-400 bg-blue-400/10 border-blue-400/20",
        A: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        R: "text-green-400 bg-green-400/10 border-green-400/20",
    };

    return (
        <section className="py-32 min-h-screen flex items-center bg-black text-white border-t border-gray-900 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
                <div className={clsx("flex flex-col md:flex-row gap-16 items-center", isLeft ? "" : "md:flex-row-reverse")}>

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <div className={clsx("inline-flex items-center gap-3 px-4 py-2 rounded-full border mb-8 font-mono font-bold", colors[type])}>
                            <span className="text-xl">{type}</span>
                            <span className="w-px h-4 bg-current opacity-30"></span>
                            <span className="tracking-widest uppercase text-sm">{labels[type]}</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">{title}</h2>

                        <div className="space-y-6 text-lg text-gray-400 leading-relaxed">
                            {content.map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visual/Child Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="flex-1 w-full"
                    >
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 aspect-video flex items-center justify-center relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {children ? children : (
                                <div className="text-gray-600 font-mono text-xl">Visual / Screenshot Placeholder</div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
