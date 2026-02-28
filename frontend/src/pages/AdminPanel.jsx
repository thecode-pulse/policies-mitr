import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics, getUsers, getActivity } from '../lib/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FiUsers, FiFileText, FiActivity } from 'react-icons/fi';

const COLORS = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export default function AdminPanel() {
    const [analytics, setAnalytics] = useState(null);
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        getAnalytics().then(r => setAnalytics(r.data)).catch(() => { });
        getUsers().then(r => setUsers(r.data)).catch(() => { });
        getActivity().then(r => setActivity(r.data)).catch(() => { });
    }, []);

    const categoryData = analytics ? Object.entries(analytics.categories || {}).map(([name, value]) => ({ name, value })) : [];
    const langData = analytics ? (analytics.languages || []).map(l => ({ name: l.language, value: l.count })) : [];

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FiActivity },
        { id: 'users', label: 'Users', icon: FiUsers },
        { id: 'activity', label: 'Activity', icon: FiFileText },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '24px' }}>Admin Dashboard</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                            background: tab === t.id ? 'var(--primary)' : 'var(--bg-dark-secondary)',
                            color: tab === t.id ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <t.icon size={16} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {tab === 'overview' && analytics && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        {[
                            { label: 'Total Users', value: analytics.total_users, icon: FiUsers, color: '#0ea5e9' },
                            { label: 'Total Policies', value: analytics.total_policies, icon: FiFileText, color: '#f97316' },
                            { label: 'Total Actions', value: analytics.total_actions, icon: FiActivity, color: '#22c55e' },
                        ].map((s, i) => (
                            <motion.div key={i} className="stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <s.icon size={20} />
                                    </div>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{s.label}</span>
                                </div>
                                <p style={{ fontSize: '32px', fontWeight: 800 }}>{s.value}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="glass-card" style={{ padding: '24px', minHeight: '320px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Categories</h3>
                            <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                            {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="glass-card" style={{ padding: '24px', minHeight: '320px' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Languages (Translations)</h3>
                            <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={langData}>
                                        <XAxis dataKey="name" stroke="#94a3b8" />
                                        <YAxis stroke="#94a3b8" />
                                        <Tooltip formatter={(value) => [value, 'Translations']} />
                                        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#94a3b8', fontSize: 12 }} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
                <div style={{ display: 'grid', gap: '8px' }}>
                    {users.map((u, i) => (
                        <div key={u.id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 600 }}>{u.full_name || 'No Name'}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{u.email}</p>
                            </div>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                background: u.role === 'admin' ? 'rgba(249,115,22,0.1)' : 'rgba(14,165,233,0.1)',
                                color: u.role === 'admin' ? '#f97316' : '#0ea5e9',
                            }}>
                                {u.role}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Activity Tab */}
            {tab === 'activity' && (
                <div style={{ display: 'grid', gap: '8px' }}>
                    {activity.slice(0, 30).map((a, i) => (
                        <div key={a.id} className="glass-card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px' }}>{a.action_type}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                    {new Date(a.created_at).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
