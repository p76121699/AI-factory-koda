"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { clsx } from "clsx";

interface CodeCardProps {
    title: string;
    codeSnippet: string;
}

export default function CodeCard({ title, codeSnippet }: CodeCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className="relative bg-gray-800 rounded-lg border border-gray-700 overflow-hidden cursor-pointer h-32"
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            whileHover={{ scale: 1.05, borderColor: "rgba(59, 130, 246, 0.5)" }}
            transition={{ duration: 0.3 }}
        >
            {/* Front Face (Title) */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center p-4 bg-gray-800 z-10"
                animate={{ opacity: isHovered ? 0 : 1 }}
            >
                <span className="font-bold text-gray-200 text-lg">{title}</span>
            </motion.div>

            {/* Back Face (Code) */}
            <motion.div
                className="absolute inset-0 bg-black/90 p-4 font-mono text-xs text-blue-300 overflow-hidden text-left"
                animate={{ opacity: isHovered ? 1 : 0 }}
            >
                <pre className="whitespace-pre-wrap">{codeSnippet}</pre>
            </motion.div>
        </motion.div>
    );
}
