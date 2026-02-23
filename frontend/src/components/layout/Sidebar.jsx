import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import {
    FiHome, FiUpload, FiFileText, FiBarChart2,
    FiLogOut, FiUsers, FiMessageSquare,
} from 'react-icons/fi';

const navItems = [
    { to: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { to: '/upload', icon: FiUpload, label: 'Upload Policy' },
    { to: '/policies', icon: FiFileText, label: 'My Policies' },
    { to: '/chat', icon: FiMessageSquare, label: 'AI Chatbot' },
    { to: '/analytics', icon: FiBarChart2, label: 'Analytics' },
];

export default function Sidebar({ user }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <aside className="sidebar" style={{ background: 'var(--bg-dark-secondary)', borderRight: '1px solid var(--border-dark)' }}>
            {/* Logo */}
            <div style={{ marginBottom: '40px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FiFileText color="white" size={18} />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                        <span style={{ color: 'var(--primary)' }}>Policy</span>Mitr
                    </h1>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1 }}>
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        style={{ position: 'relative', overflow: 'hidden' }}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={19} />
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-glow"
                                        style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                                            background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)'
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}

                {/* Admin link */}
                {user?.role === 'admin' && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <FiUsers size={19} />
                        <span>Admin Portal</span>
                    </NavLink>
                )}
            </nav>

            {/* User & Logout */}
            < div style={{ padding: '16px', borderTop: '1px solid var(--border-dark)' }}>
                <div style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    border: '1px solid var(--border-light)'
                }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {user?.role || 'Basic User'}
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="sidebar-link"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#f87171' }}
                >
                    <FiLogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div >
        </aside >
    );
}
