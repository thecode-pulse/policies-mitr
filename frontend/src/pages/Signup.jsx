import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Signup() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);

        try {
            // 1. Sign up the user
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: fullName } },
            });

            if (signUpError) {
                toast.error(signUpError.message);
                setLoading(false);
                return;
            }

            // 2. Create profile in the profiles table
            if (signUpData?.user) {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: signUpData.user.id,
                    full_name: fullName,
                    email: email,
                    role: 'user',
                });
                if (profileError) {
                    console.warn('Profile creation error:', profileError);
                }
            }

            // 3. Auto-login after signup
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) {
                // If auto-login fails (e.g. email confirmation required), redirect to login page
                toast.success('Account created! Please check your email or login.');
                navigate('/login');
            } else {
                toast.success('Welcome to PolicyMitr! 🎉');
                navigate('/dashboard');
            }
        } catch (err) {
            toast.error('Something went wrong');
            console.error(err);
        } finally {
            setLoading(false);
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
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Create your free account</p>
                </div>

                <form onSubmit={handleSignup}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Full Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>
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
                            placeholder="Min 6 characters"
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
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Login</Link>
                </p>
            </motion.div>
        </div>
    );
}
