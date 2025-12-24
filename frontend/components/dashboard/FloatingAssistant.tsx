"use client";

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFactory } from '../../context/FactoryContext';

export default function FloatingAssistant() {
    const { data, chatMessages: messages, addChatMessage, setChatMessages } = useFactory();
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isOpen]);

    const sendMessage = async (text: string = input) => {
        if (!text.trim()) return;

        // Add user message immediately
        addChatMessage({ role: 'user', content: text });
        setInput("");

        // Loading state
        addChatMessage({ role: 'assistant', content: "Thinking...", isLoading: true });

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${apiUrl}/api/v1/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await res.json();

            // Remove loading message and add real response
            setChatMessages(prev => {
                const filtered = prev.filter(m => !m.isLoading);
                return [...filtered, { role: 'assistant', content: data.response }];
            });

        } catch (error) {
            console.error("Chat error:", error);
            setChatMessages(prev => {
                const filtered = prev.filter(m => !m.isLoading);
                return [...filtered, { role: 'assistant', content: "Sorry, I can't reach the backend server right now." }];
            });
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-96 h-[600px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">Factory Copilot</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-xs text-gray-400">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
                            {messages.map((m, i) => (
                                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                                        }`}>
                                        {(() => {
                                            let text = m.content;
                                            // 1. Try to parse accidentally exposed JSON
                                            if (text.trim().startsWith('{')) {
                                                try {
                                                    const parsed = JSON.parse(text);
                                                    if (parsed.response) text = parsed.response;
                                                } catch (e) { /* ignore */ }
                                            }

                                            // 2. Strip System Command Tags [[EXECUTE:...]]
                                            text = text.replace(/\[\[EXECUTE:.*?\]\]/g, '').trim();

                                            return text || "...";
                                        })()}
                                    </div>

                                    {/* Action Chips */}
                                    {m.role === 'assistant' && m.actions && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {m.actions.map(action => (
                                                <button
                                                    key={action}
                                                    onClick={() => sendMessage(action)}
                                                    className="text-xs bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-800/50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3 h-3" /> {action}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <div className="relative">
                                <input
                                    className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    placeholder="Ask about machine status..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center z-50 transition-colors"
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>
        </>
    );
}
