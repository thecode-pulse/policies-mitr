import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { listPolicies, deletePolicy, toggleBookmark } from '../lib/api';
import toast from 'react-hot-toast';
import { FiFileText, FiTrash2, FiEye, FiTag, FiClock, FiSearch, FiBookmark, FiStar } from 'react-icons/fi';

const FILTERS = [
    { key: 'all', label: '📂 All Policies' },
    { key: 'bookmarked', label: '⭐ Bookmarked' },
    { key: 'not_bookmarked', label: '📄 Not Bookmarked' },
];

export default function MyPolicies() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await listPolicies();
            setPolicies(res.data || []);
        } catch (err) {
            toast.error('Failed to load policies');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this policy?')) return;
        try {
            await deletePolicy(id);
            setPolicies((prev) => prev.filter((p) => p.id !== id));
            toast.success('Policy deleted');
        } catch {
            toast.error('Delete failed');
        }
    };

    const handleBookmark = async (id, e) => {
        e.stopPropagation();
        try {
            const res = await toggleBookmark(id);
            const newState = res.data.is_bookmarked;
            setPolicies((prev) =>
                prev.map((p) => (p.id === id ? { ...p, is_bookmarked: newState } : p))
            );
            toast.success(newState ? 'Bookmarked ⭐' : 'Bookmark removed');
        } catch {
            toast.error('Bookmark failed');
        }
    };

    const filtered = policies
        .filter((p) => {
            if (filter === 'bookmarked') return p.is_bookmarked;
            if (filter === 'not_bookmarked') return !p.is_bookmarked;
            return true;
        })
        .filter(
            (p) =>
                p.title?.toLowerCase().includes(search.toLowerCase()) ||
                p.category?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>📁 My Policies</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                            {policies.length} {policies.length === 1 ? 'policy' : 'policies'} analyzed
                        </p>
                    </div>
                    <button className="btn-gradient" onClick={() => navigate('/upload')}>
                        + Upload New
                    </button>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            style={{
                                padding: '8px 18px', borderRadius: '20px', fontSize: '13px',
                                fontWeight: filter === f.key ? 700 : 500,
                                background: filter === f.key
                                    ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                    : 'var(--bg-dark)',
                                border: filter === f.key ? 'none' : '1px solid var(--border)',
                                color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {f.label}
                            {f.key === 'bookmarked' && (
                                <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>
                                    ({policies.filter(p => p.is_bookmarked).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <FiSearch size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        className="input-field"
                        placeholder="Search by title or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ paddingLeft: '44px' }}
                    />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                        <div className="spinner" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>
                            {filter === 'bookmarked' ? '⭐' : '📄'}
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '20px' }}>
                            {filter === 'bookmarked'
                                ? 'No bookmarked policies yet. Star your favorites!'
                                : search
                                    ? 'No policies match your search.'
                                    : 'No policies yet. Upload your first one!'}
                        </p>
                        {!search && filter === 'all' && (
                            <button className="btn-gradient" onClick={() => navigate('/upload')}>
                                🚀 Upload First Policy
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <AnimatePresence>
                            {filtered.map((p, idx) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-card"
                                    style={{ padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onClick={() => navigate(`/policy/${p.id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                <FiFileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                                <h3 style={{ fontWeight: 700, fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {p.title}
                                                </h3>
                                                {p.is_bookmarked && (
                                                    <span style={{ color: '#f59e0b', fontSize: '14px', flexShrink: 0 }}>⭐</span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FiTag size={12} /> {p.category}
                                                </span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FiClock size={12} /> {new Date(p.created_at).toLocaleDateString()}
                                                </span>
                                                <span>{p.processing_time}s</span>
                                            </div>
                                            {p.summary && (
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                    {p.summary}
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', flexShrink: 0 }}>
                                            <button
                                                onClick={(e) => handleBookmark(p.id, e)}
                                                title={p.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                                                style={{
                                                    background: p.is_bookmarked
                                                        ? 'rgba(245,158,11,0.15)'
                                                        : 'rgba(148,163,184,0.1)',
                                                    border: `1px solid ${p.is_bookmarked ? 'rgba(245,158,11,0.3)' : 'rgba(148,163,184,0.2)'}`,
                                                    color: p.is_bookmarked ? '#f59e0b' : 'var(--text-secondary)',
                                                    padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                <FiStar size={16} style={{ fill: p.is_bookmarked ? '#f59e0b' : 'none' }} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/policy/${p.id}`); }}
                                                style={{
                                                    background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
                                                    color: 'var(--primary)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                                                }}
                                            >
                                                <FiEye size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(p.id, e)}
                                                style={{
                                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                                    color: '#ef4444', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                                                }}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
