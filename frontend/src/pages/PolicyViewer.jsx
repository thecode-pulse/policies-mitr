import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiClock, FiTag, FiBarChart2, FiMessageCircle, FiSquare, FiVolume2, FiGlobe, FiChevronUp, FiChevronDown, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getPolicy, chat, translateText, textToSpeech } from "../lib/api";

const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1, y: 0,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1, y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

export default function PolicyViewer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activTab, setActivTab] = useState('summary');
    const [expandedClause, setExpandedClause] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const [translatedSummary, setTranslatedSummary] = useState('');
    const [translating, setTranslating] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        loadPolicy();
    }, [id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const loadPolicy = async () => {
        try {
            const res = await getPolicy(id);
            setPolicy(res.data);
        } catch (err) {
            toast.error('Failed to load policy');
            navigate('/policies');
        } finally {
            setLoading(false);
        }
    };

    const handleChat = async () => {
        if (!chatInput.trim()) return;
        const userMsg = chatInput.trim();
        setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setChatLoading(true);

        try {
            const res = await chat(userMsg, id);
            setChatMessages((prev) => [...prev, { role: 'assistant', content: res.data.answer }]);
        } catch (err) {
            setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleTranslate = async (text, lang) => {
        setTranslating(true);
        try {
            const res = await translateText(text, lang);
            setTranslatedSummary(res.data.translated_text);
        } catch {
            toast.error('Translation failed');
        } finally {
            setTranslating(false);
        }
    };

    const [playing, setPlaying] = useState(false);
    const [loadingTts, setLoadingTts] = useState(false);
    const audioRef = useRef(null);

    const handleSpeak = async (text, lang = 'en', e) => {
        if (e) e.stopPropagation();

        if (playing) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setPlaying(false);
            return;
        }

        setLoadingTts(true);
        try {
            const res = await textToSpeech(text, lang);
            const url = URL.createObjectURL(res.data);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setPlaying(false);
                URL.revokeObjectURL(url);
            };

            audio.onplay = () => {
                setLoadingTts(false);
                setPlaying(true);
            };

            await audio.play();
        } catch {
            setLoadingTts(false);
            toast.error('Text-to-Speech failed');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>Analyzing policy layers...</p>
            </div>
        );
    }

    if (!policy) return null;

    const tabs = [
        { key: 'summary', label: 'Summary', icon: FiBarChart2 },
        { key: 'clauses', label: 'Clauses', icon: FiTag },
        { key: 'chat', label: 'Ask AI', icon: FiMessageCircle },
    ];

    const confidencePct = Math.round((policy.ai_confidence || 0.5) * 100);
    const difficultyColor = policy.difficulty_score > 70 ? '#f87171' : policy.difficulty_score > 40 ? '#fbbf24' : '#34d399';

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                {/* Header Navigation */}
                <motion.button
                    variants={itemVariants}
                    onClick={() => navigate('/policies')}
                    style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)',
                        color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px',
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                        fontSize: '13px', fontWeight: 600, borderRadius: '100px',
                    }}
                >
                    <FiArrowLeft size={16} /> Back to My Policies
                </motion.button>

                {/* Main Header Card */}
                <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', background: 'rgba(14,165,233,0.1)', color: 'var(--primary-light)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                                {policy.category}
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '12px', lineHeight: 1.2 }}>{policy.title}</h1>
                            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiClock size={16} /> Processed in {policy.processing_time}s
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiTag size={16} /> Document Analysis Complete
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className="glass-card" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '130px', background: 'rgba(14,165,233,0.05)', borderColor: 'rgba(14,165,233,0.2)' }}>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary-light)' }}>{confidencePct}%</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AI Confidence</div>
                            </div>
                            <div className="glass-card" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '130px', background: `${difficultyColor}10`, borderColor: `${difficultyColor}30` }}>
                                <div style={{ fontSize: '24px', fontWeight: 900, color: difficultyColor }}>{policy.difficulty_score}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Complexity</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs with Underline Animation */}
                <motion.div variants={itemVariants} style={{ display: 'flex', padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', marginBottom: '32px', border: '1px solid var(--border-light)' }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActivTab(tab.key)}
                            style={{
                                flex: 1, padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                fontWeight: 700, fontSize: '14px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative', overflow: 'hidden',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                background: activTab === tab.key ? 'var(--primary)' : 'transparent',
                                color: activTab === tab.key ? '#fff' : 'var(--text-secondary)',
                                boxShadow: activTab === tab.key ? 'var(--shadow-primary)' : 'none',
                            }}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activTab === 'summary' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Main Summary */}
                                <div className="glass-card" style={{ padding: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                                <FiBarChart2 size={20} />
                                            </div>
                                            <h3 style={{ fontWeight: 800, fontSize: '20px' }}>Executive Summary</h3>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                type="button"
                                                onClick={(e) => handleSpeak(policy.summary, 'en', e)}
                                                disabled={loadingTts}
                                                className="btn-secondary"
                                                style={{ padding: '10px 18px', fontSize: '13px', gap: '8px' }}
                                            >
                                                {loadingTts ? '...' : playing ? <FiSquare size={14} /> : <FiVolume2 size={16} />}
                                                {playing ? 'Stop' : 'Listen'}
                                            </button>
                                            <button
                                                onClick={() => handleTranslate(policy.summary, 'hi')}
                                                disabled={translating}
                                                className="btn-gradient"
                                                style={{ padding: '10px 20px', fontSize: '13px', gap: '8px' }}
                                            >
                                                <FiGlobe size={16} /> {translating ? 'Translating...' : 'Hindi'}
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '16px', whiteSpace: 'pre-line' }}>
                                        {policy.summary}
                                    </p>

                                    {/* Translation Block */}
                                    <AnimatePresence>
                                        {translatedSummary && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                style={{
                                                    marginTop: '32px', padding: '24px', borderRadius: '16px',
                                                    background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.15)',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <h4 style={{ fontWeight: 800, color: 'var(--accent-light)', fontSize: '15px' }}>🇮🇳 Hindi Translation</h4>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleSpeak(translatedSummary, 'hi', e)}
                                                        disabled={loadingTts}
                                                        style={{
                                                            background: 'rgba(139, 92, 246, 0.1)', border: 'none',
                                                            color: 'var(--accent-light)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                                                            fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        {playing ? <FiSquare size={12} /> : <FiVolume2 size={14} />} Listen (Hindi)
                                                    </button>
                                                </div>
                                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, fontSize: '16px' }}>
                                                    {translatedSummary}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Key Insights / Simplified */}
                                <div className="glass-card" style={{ padding: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                            <FiTag size={20} />
                                        </div>
                                        <h3 style={{ fontWeight: 800, fontSize: '20px' }}>Simplified Insights</h3>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '15px', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                        {policy.simplified || 'A simplified version is being generated for this policy.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {activTab === 'clauses' && (
                            <div className="glass-card" style={{ padding: '32px' }}>
                                <div style={{ marginBottom: '32px' }}>
                                    <h3 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>Detailed Breakdown</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Extracted {policy.clauses?.length || 0} legal clauses with AI-powered simplified explanations.</p>
                                </div>

                                {(!policy.clauses || policy.clauses.length === 0) ? (
                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No individual clauses were identified in this document.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {policy.clauses.map((clause, idx) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    borderRadius: '16px', overflow: 'hidden',
                                                    background: expandedClause === idx ? 'rgba(14, 165, 233, 0.02)' : 'rgba(255,255,255,0.01)',
                                                    border: '1px solid',
                                                    borderColor: expandedClause === idx ? 'var(--primary)' : 'var(--border-light)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <button
                                                    onClick={() => setExpandedClause(expandedClause === idx ? null : idx)}
                                                    style={{
                                                        width: '100%', padding: '24px', background: 'transparent',
                                                        border: 'none', cursor: 'pointer', textAlign: 'left',
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: expandedClause === idx ? 'var(--primary)' : 'var(--bg-dark-secondary)',
                                                            color: expandedClause === idx ? 'white' : 'var(--primary)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800,
                                                            transition: 'all 0.3s'
                                                        }}>
                                                            {idx + 1}
                                                        </div>
                                                        <span style={{ fontWeight: 700, fontSize: '15px', color: expandedClause === idx ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                            {clause.clause_text?.slice(0, 80)}...
                                                        </span>
                                                    </div>
                                                    {expandedClause === idx ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                                                </button>
                                                <AnimatePresence>
                                                    {expandedClause === idx && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div style={{ padding: '0 24px 24px 72px' }}>
                                                                <div style={{
                                                                    padding: '20px', borderRadius: '12px', marginBottom: '20px',
                                                                    background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-light)',
                                                                }}>
                                                                    <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                                        "{clause.clause_text}"
                                                                    </p>
                                                                </div>
                                                                <div style={{
                                                                    padding: '20px', borderRadius: '12px',
                                                                    background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                        <h5 style={{ fontWeight: 800, fontSize: '13px', color: '#34d399', textTransform: 'uppercase', letterSpacing: '1px' }}>What this means</h5>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleSpeak(clause.explanation, 'en', e)}
                                                                            disabled={loadingTts}
                                                                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                                                                        >
                                                                            <FiVolume2 /> Speak
                                                                        </button>
                                                                    </div>
                                                                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                                                                        {clause.explanation}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activTab === 'chat' && (
                            <div className="glass-card" style={{ padding: '32px', height: '600px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)' }}>
                                        <FiMessageCircle size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 800, fontSize: '20px' }}>Policy Assistant</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Conversational AI specifically trained on this document</p>
                                    </div>
                                </div>

                                {/* Chat Messages Container */}
                                <div style={{
                                    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px',
                                    paddingRight: '12px', marginBottom: '24px', scrollbarWidth: 'thin'
                                }}>
                                    {chatMessages.length === 0 && (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                            <div style={{ maxWidth: '400px' }}>
                                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
                                                <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Ask anything about this policy</h4>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Try one of these frequent questions to get started:</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                                    {["Key benefits?", "Eligibility criteria?", "Filing deadline?", "Documentation required?"].map((q) => (
                                                        <button
                                                            key={q}
                                                            onClick={() => { setChatInput(q); }}
                                                            className="btn-secondary"
                                                            style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '100px' }}
                                                        >
                                                            {q}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {chatMessages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            style={{
                                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                padding: '16px 20px',
                                                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                border: msg.role === 'user' ? 'none' : '1px solid var(--border-light)',
                                                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                                                fontSize: '15px',
                                                lineHeight: 1.6,
                                                boxShadow: msg.role === 'user' ? 'var(--shadow-primary)' : 'none',
                                            }}
                                        >
                                            {msg.content}
                                        </motion.div>
                                    ))}
                                    {chatLoading && (
                                        <div style={{ alignSelf: 'flex-start', padding: '16px 24px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chat Input Unit */}
                                <div style={{
                                    display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.3)',
                                    padding: '8px', borderRadius: '16px', border: '1px solid var(--border-light)'
                                }}>
                                    <input
                                        className="input-field"
                                        placeholder="Type your question..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                        disabled={chatLoading}
                                        style={{ border: 'none', background: 'transparent' }}
                                    />
                                    <button
                                        onClick={handleChat}
                                        disabled={chatLoading || !chatInput.trim()}
                                        className="btn-gradient"
                                        style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', flexShrink: 0 }}
                                    >
                                        <FiSend size={20} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
