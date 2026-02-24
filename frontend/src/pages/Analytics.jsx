import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiFileText, FiClock, FiActivity } from 'react-icons/fi';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend
} from 'recharts';
import { listPolicies } from '../lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

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

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [policies, setPolicies] = useState([]);

    // Aggregated Data States
    const [stats, setStats] = useState({
        total: 0,
        avgDifficulty: 0,
        avgTime: 0,
    });
    const [categoryData, setCategoryData] = useState([]);
    const [timelineData, setTimelineData] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await listPolicies();
            const data = res.data || [];
            setPolicies(data);
            processAnalytics(data);
        } catch (err) {
            toast.error('Failed to load analytics data.');
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (data) => {
        if (!data.length) return;

        // 1. Basic Stats
        const total = data.length;
        const avgDifficulty = Math.round(data.reduce((acc, p) => acc + (p.difficulty_score || 0), 0) / total);
        const avgTime = (data.reduce((acc, p) => acc + (p.processing_time || 0), 0) / total).toFixed(1);

        setStats({ total, avgDifficulty, avgTime });

        // 2. Category Distribution
        const categoryCounts = {};
        data.forEach(p => {
            const cat = p.category || 'Other';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        const catArray = Object.keys(categoryCounts).map(key => ({
            name: key,
            value: categoryCounts[key]
        })).sort((a, b) => b.value - a.value);

        setCategoryData(catArray);

        // 3. Timeline (Difficulty & Processing Time over recent policies)
        // Sort ascending by date for the timeline
        const sortedData = [...data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // Take last 10 for readability
        const recentData = sortedData.slice(-10).map(p => ({
            name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
            difficulty: p.difficulty_score || 0,
            time: p.processing_time || 0
        }));

        setTimelineData(recentData);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'var(--bg-dark-secondary)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '8px', boxShadow: 'var(--shadow-xl)' }}>
                    <p style={{ fontWeight: 700, marginBottom: '6px', color: '#fff' }}>{label || payload[0].name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '14px', margin: '2px 0' }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '600px', gap: '20px' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Crunching the numbers...</p>
            </div>
        );
    }

    if (policies.length === 0) {
        return (
            <div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                    <FiBarChart2 style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    My Analytics
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    Your personal usage statistics.
                </p>
                <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <p style={{ fontSize: '48px', marginBottom: '12px' }}>📊</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Analytics will appear automatically as you process more policy documents.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '40px' }}>
            <motion.div initial="hidden" animate="visible" variants={containerVariants}>

                {/* Header */}
                <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                        <FiBarChart2 style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        My Analytics
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Insights and trends from your document analysis history.
                    </p>
                </motion.div>

                {/* Top Stats Cards */}
                <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14,165,233,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiFileText size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Documents Processed</p>
                            <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.total}</h3>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiActivity size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Avg. Difficulty Score</p>
                            <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.avgDifficulty}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>/100</span></h3>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiClock size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Avg AI Processing</p>
                            <h3 style={{ fontSize: '28px', fontWeight: 800 }}>{stats.avgTime}<span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>s</span></h3>
                        </div>
                    </div>
                </motion.div>

                {/* Main Charts Area */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                    {/* Category Distribution Pie Chart */}
                    <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Category Breakdown</h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Complexity & Processing Timeline Line Chart */}
                    <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Recent Document Metrics</h3>
                        <div style={{ width: '100%', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timelineData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="difficulty"
                                        name="Complexity Score"
                                        stroke="var(--accent)"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: 'var(--accent)' }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="time"
                                        name="Processing Time (s)"
                                        stroke="var(--primary)"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: 'var(--primary)' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                </div>

            </motion.div>
        </div>
    );
}
