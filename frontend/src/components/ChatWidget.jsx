import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiZap } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chat } from '../lib/api';
import toast from 'react-hot-toast';

const SUGGESTED = [
    "What is the purpose of this policy?",
    "Who benefits from this scheme?",
    "What documents are needed to apply?",
    "Explain the eligibility criteria",
];

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m Mitr 🤖, your AI policy assistant. Ask me anything about government policies!' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const sendMessage = async (text) => {
        const query = text || input.trim();
        if (!query || loading) return;

        // Detect policy context from URL
        const policyIdMatch = window.location.pathname.match(/\/policy\/([^\/]+)/);
        const policyId = policyIdMatch ? policyIdMatch[1] : null;

        setMessages((prev) => [...prev, { role: 'user', content: query }]);
        setInput('');
        setLoading(true);

        try {
            const res = await chat(query, policyId);
            const answer = res.data.answer;
            const isOffline = answer.includes('*(AI Offline Mode)*');

            setMessages((prev) => [...prev, {
                role: 'assistant',
                content: answer.replace('*(AI Offline Mode)*', ''),
                isOffline
            }]);
        } catch {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setOpen(!open)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    border: 'none', color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(14,165,233,0.4)',
                }}
            >
                {open ? <FiX size={24} /> : <FiMessageSquare size={24} />}
            </motion.button>

            {/* Chat Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'fixed', bottom: '90px', right: '24px', zIndex: 999,
                            width: '380px', maxHeight: '520px',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: '16px', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid var(--border)',
                            background: 'linear-gradient(135deg, rgba(14,165,233,0.1), rgba(168,85,247,0.1))',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <FiZap size={18} style={{ color: 'var(--primary)' }} />
                            <div>
                                <h4 style={{ fontWeight: 700, fontSize: '15px' }}>Mitr AI Assistant</h4>
                                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Powered by Gemini</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', minHeight: '280px', maxHeight: '340px' }}>
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        marginBottom: '12px',
                                        display: 'flex',
                                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '85%', padding: '10px 14px', borderRadius: '14px',
                                        fontSize: '13px', lineHeight: 1.5,
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                            : 'var(--bg-dark)',
                                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                        position: 'relative'
                                    }}>
                                        {msg.role === 'user' ? (
                                            msg.content
                                        ) : (
                                            <div className="markdown-content">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        )}
                                        {msg.isOffline && (
                                            <div style={{
                                                fontSize: '9px', color: 'var(--text-secondary)',
                                                marginTop: '4px', fontStyle: 'italic', borderTop: '0.5px solid var(--border)',
                                                paddingTop: '2px'
                                            }}>
                                                Mitr Offline Mode (Keyword Search)
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', gap: '4px', padding: '10px' }}>
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                            style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}
                                        />
                                    ))}
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Suggested (show only at start) */}
                        {messages.length <= 1 && (
                            <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {SUGGESTED.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        style={{
                                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px',
                                            background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
                                            color: 'var(--primary)', cursor: 'pointer', whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{
                            padding: '12px 16px', borderTop: '1px solid var(--border)',
                            display: 'flex', gap: '8px', alignItems: 'center',
                        }}>
                            <input
                                className="input-field"
                                placeholder="Ask about any policy..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                style={{ flex: 1, margin: 0, padding: '10px 14px', fontSize: '13px' }}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={loading || !input.trim()}
                                style={{
                                    width: '38px', height: '38px', borderRadius: '10px',
                                    background: input.trim() ? 'var(--primary)' : 'var(--bg-dark)',
                                    border: 'none', color: '#fff', cursor: input.trim() ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'background 0.2s',
                                }}
                            >
                                <FiSend size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
