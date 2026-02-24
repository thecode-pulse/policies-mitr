import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listPolicies } from '../lib/api';
import { FiUploadCloud, FiFileText, FiMessageCircle, FiTrendingUp, FiArrowRight, FiClock } from 'react-icons/fi';

export default function Dashboard() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await listPolicies();
            setPolicies(res.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: 'Policies Analyzed', value: policies.length, icon: FiFileText, color: '#3b82f6' },
        { label: 'Avg AI Confidence', value: policies.length > 0 ? `${Math.round((policies.reduce((a, b) => a + (b.ai_confidence || 0), 0) / policies.length) * 100)}%` : '—', icon: FiTrendingUp, color: '#22c55e' },
        { label: 'Total Processing', value: policies.length > 0 ? `${policies.reduce((a, b) => a + (b.processing_time || 0), 0).toFixed(1)}s` : '—', icon: FiClock, color: '#f59e0b' },
    ];

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>👋 Welcome back!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '15px' }}>
                    Your PolicyMitr dashboard — upload, analyze, and understand government policies with AI.
                </p>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card"
                            style={{ padding: '24px', textAlign: 'center' }}
                        >
                            <stat.icon size={28} style={{ color: stat.color, marginBottom: '12px' }} />
                            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                    <motion.div
                        className="glass-card"
                        style={{ padding: '28px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                        onClick={() => navigate('/upload')}
                        whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }}
                    >
                        <FiUploadCloud size={32} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                        <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Upload New Policy</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                            Upload a PDF or image for AI analysis
                        </p>
                    </motion.div>
                    <motion.div
                        className="glass-card"
                        style={{ padding: '28px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                        onClick={() => navigate('/chat')}
                        whileHover={{ scale: 1.02, borderColor: '#a855f7' }}
                    >
                        <FiMessageCircle size={32} style={{ color: '#a855f7', marginBottom: '16px' }} />
                        <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>AI Chatbot</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                            Ask questions about any policy
                        </p>
                    </motion.div>
                </div>

                {/* Recent Policies */}
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '18px' }}>📄 Recent Policies</h3>
                        {policies.length > 0 && (
                            <Link
                                to="/policies"
                                style={{
                                    color: 'var(--primary)', fontSize: '14px', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none',
                                }}
                            >
                                View all <FiArrowRight size={14} />
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <div className="spinner" />
                        </div>
                    ) : policies.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '15px' }}>
                                No policies yet. Upload your first one!
                            </p>
                            <button className="btn-gradient" onClick={() => navigate('/upload')}>
                                🚀 Upload First Policy
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {policies.slice(0, 5).map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => navigate(`/policy/${p.id}`)}
                                    style={{
                                        padding: '16px 20px', borderRadius: '12px', cursor: 'pointer',
                                        border: '1px solid var(--border)', transition: 'all 0.2s',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    }}
                                    className="hover-card"
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{p.title}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            {p.category} • {new Date(p.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                        background: 'rgba(14,165,233,0.08)', color: 'var(--primary)',
                                    }}>
                                        {Math.round((p.ai_confidence || 0.5) * 100)}% AI
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
