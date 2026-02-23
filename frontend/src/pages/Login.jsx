import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            // Ensure profile exists
            if (data?.user) {
                const { data: profile } = await supabase.from('profiles').select('id').eq('id', data.user.id).single();
                if (!profile) {
                    await supabase.from('profiles').upsert({
                        id: data.user.id,
                        full_name: data.user.user_metadata?.full_name || '',
                        email: data.user.email,
                        role: 'user',
                    });
                }
            }
            toast.success('Welcome back! 🎉');
            navigate('/dashboard');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            padding: '24px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-card"
                style={{ width: '100%', maxWidth: '440px', padding: '48px 40px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 className="gradient-text" style={{ fontSize: '28px', fontWeight: 800 }}>📜 PolicyMitr</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Welcome back! Login to continue.</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn-gradient"
                        style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign Up</Link>
                </p>
            </motion.div>
        </div>
    );
}
