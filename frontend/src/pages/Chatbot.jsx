import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { chat, listPolicies } from '../lib/api';
import toast from 'react-hot-toast';
import { FiSend, FiMessageCircle, FiCopy } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chatbot() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState([]);
    const [selectedPolicy, setSelectedPolicy] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        listPolicies().then((res) => setPolicies(res.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = input.trim();
        setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const res = await chat(userMsg, selectedPolicy || null);
            setMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (err) {
            setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to AI. Make sure the backend is running.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Message copied to clipboard!");
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', height: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '16px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                        <FiMessageCircle style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        AI Policy Assistant
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                        Ask questions about any policy or government scheme.
                    </p>
                    {policies.length > 0 && (
                        <select
                            className="input-field"
                            value={selectedPolicy}
                            onChange={(e) => setSelectedPolicy(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        >
                            <option value="">💬 General chat (no specific policy)</option>
                            {policies.map((p) => (
                                <option key={p.id} value={p.id}>📄 {p.title}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Chat Messages */}
                <div className="glass-card" style={{
                    flex: 1, padding: '20px', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', minHeight: 0,
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
                        {messages.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤖</div>
                                    <h3 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '18px' }}>Hi, I'm Mitr!</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '320px', lineHeight: 1.6 }}>
                                        I can help you understand government policies, schemes, and their benefits.
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                        {[
                                            "What is PM Awas Yojana?",
                                            "Explain Beti Bachao Beti Padhao",
                                            "How to apply for MGNREGA?",
                                            "What schemes are for farmers?",
                                        ].map((q) => (
                                            <button
                                                key={q}
                                                onClick={() => setInput(q)}
                                                style={{
                                                    padding: '10px 18px', borderRadius: '24px', fontSize: '13px',
                                                    background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)',
                                                    color: 'var(--primary)', cursor: 'pointer', fontWeight: 500,
                                                }}
                                            >
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%',
                                        padding: '14px 20px',
                                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                        color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                        fontSize: '15px', lineHeight: 1.7,
                                        // whiteSpace: 'pre-wrap', // Removed for Markdown
                                    }}
                                >
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Mitr AI
                                                </span>
                                                <button
                                                    onClick={() => handleCopy(msg.content)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                    title="Copy response"
                                                >
                                                    <FiCopy size={14} />
                                                </button>
                                            </div>
                                            <div className="markdown-content">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                        {loading && (
                            <div style={{
                                alignSelf: 'flex-start', padding: '14px 20px', borderRadius: '20px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: '8px',
                            }}>
                                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Thinking...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <input
                            className="input-field"
                            placeholder="Ask anything about policies..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            disabled={loading}
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="btn-gradient"
                            style={{ padding: '12px 24px', opacity: loading ? 0.7 : 1 }}
                        >
                            <FiSend size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
