import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/3d/ParticleBackground';
import {
    FiFileText, FiSearch, FiGlobe, FiHeadphones,
    FiMessageSquare, FiDownload, FiArrowRight,
} from 'react-icons/fi';

const features = [
    { icon: FiFileText, title: 'AI Summary', desc: 'Get concise summaries of complex policies in seconds.' },
    { icon: FiSearch, title: 'Clause Explanation', desc: 'Each clause explained in simple language.' },
    { icon: FiGlobe, title: 'Multilingual', desc: 'Translate to Hindi, Marathi, Tamil, Bengali & more.' },
    { icon: FiHeadphones, title: 'Voice Assistant', desc: 'Listen to summaries in your preferred language.' },
    { icon: FiMessageSquare, title: 'AI Chatbot', desc: 'Ask questions about any uploaded policy.' },
    { icon: FiDownload, title: 'Download', desc: 'Export summaries as PDF or Word. 	' },
];

const steps = [
    { num: '01', title: 'Upload', desc: 'Upload your policy document (PDF or Image).' },
    { num: '02', title: 'AI Processing', desc: 'Our AI analyzes, classifies, and summarizes.' },
    { num: '03', title: 'Clear Results', desc: 'Get easy-to-understand explanations and audio.' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
};

export default function LandingPage({ user }) {
    const navigate = useNavigate();

    return (
        <div style={{ background: 'var(--bg-dark)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            {/* ===== HEADER ===== */}
            <header style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 100,
                background: 'rgba(2, 6, 23, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-dark)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <FiFileText color="white" size={18} />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                        <span style={{ color: 'var(--primary)' }}>Policy</span>Mitr
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {!user ? (
                        <>
                            <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: '14px', minHeight: 'auto' }} onClick={() => navigate('/login')}>
                                Login
                            </button>
                            <button className="btn-gradient" style={{ padding: '8px 20px', fontSize: '14px', minHeight: 'auto' }} onClick={() => navigate('/signup')}>
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <button className="btn-gradient" style={{ padding: '8px 20px', fontSize: '14px', minHeight: 'auto' }} onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    )}
                </div>
            </header>

            {/* ===== HERO SECTION ===== */}
            <section style={{
                position: 'relative',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'hidden',
                padding: '0 20px',
            }}>
                <ParticleBackground />

                {/* Decorative blobs for "wow" factor */}
                <div style={{
                    position: 'absolute', top: '20%', left: '10%', width: '300px', height: '300px',
                    background: 'var(--primary)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%', zIndex: 0
                }} />
                <div style={{
                    position: 'absolute', bottom: '20%', right: '10%', width: '400px', height: '400px',
                    background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.1, borderRadius: '50%', zIndex: 0
                }} />

                <motion.div
                    style={{ position: 'relative', zIndex: 1, maxWidth: '900px' }}
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '8px 20px', borderRadius: '100px', background: 'rgba(14, 165, 233, 0.1)',
                            border: '1px solid rgba(14, 165, 233, 0.2)', marginBottom: '24px'
                        }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary-light)' }}>
                                Next-Gen Policy Analysis
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1
                        variants={itemVariants}
                        style={{ fontSize: 'clamp(40px, 8vw, 72px)', fontWeight: 900, lineHeight: 1, marginBottom: '24px', letterSpacing: '-0.02em' }}
                    >
                        Master Government <br />
                        <span className="gradient-text">Policies in Seconds</span>
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 48px', lineHeight: 1.6 }}
                    >
                        PolicyMitr uses advanced AI to translate, summarize, and explain complex
                        government documents, making legal knowledge accessible to everyone instantly.
                    </motion.p>

                    <motion.div variants={itemVariants} style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-gradient" onClick={() => navigate(user ? '/dashboard' : '/login')}>
                            {user ? 'Go to Dashboard' : 'Get Started to Explore'} <FiArrowRight style={{ marginLeft: '10px' }} />
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* ===== TRUST BAR ===== */}
            <section style={{ padding: '60px 20px', borderTop: '1px solid var(--border-dark)', borderBottom: '1px solid var(--border-dark)', background: '#020617' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '40px', opacity: 0.6, filter: 'grayscale(1)' }}>
                    {/* Brand logos placeholder/icons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700 }}><FiGlobe /> Government Hub</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700 }}><FiFileText /> DocuVerify</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700 }}><FiSearch /> LegalAssist</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: 700 }}><FiMessageSquare /> AI.Auth</div>
                </div>
            </section>

            {/* ===== FEATURES SECTIONS ===== */}
            <section style={{ padding: '120px 24px', position: 'relative' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '20px' }}>
                            Engineered for <span className="gradient-text">Simplicity</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                            We've combined world-class AI with an intuitive interface to handle the complexity for you.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                className="glass-card"
                                style={{ padding: '40px' }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                            >
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '24px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                                }}>
                                    <f.icon size={26} color="white" />
                                </div>
                                <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7 }}>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STEPS SECTION ===== */}
            <section style={{ padding: '100px 24px', background: 'linear-gradient(to bottom, #020617, #0f172a)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap-reverse' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '40px' }}>Seamless <span className="gradient-text">Workflow</span></h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                {steps.map((s, i) => (
                                    <motion.div
                                        key={i}
                                        style={{ display: 'flex', gap: '20px' }}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.2 }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                                            fontWeight: 800, flexShrink: 0
                                        }}>
                                            {s.num}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{s.title}</h4>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{s.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1.2, minWidth: '300px' }}>
                            <motion.div
                                className="glass-card"
                                style={{ padding: '20px', transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)' }}
                                whileHover={{ transform: 'perspective(1000px) rotateY(0deg) rotateX(0deg)' }}
                            >
                                <div style={{ height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FiFileText size={80} style={{ opacity: 0.1 }} />
                                    <div style={{ position: 'absolute', top: '20px', left: '20px', right: '20px' }}>
                                        <div style={{ height: '12px', width: '60%', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '10px' }} />
                                        <div style={{ height: '12px', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '10px' }} />
                                        <div style={{ height: '12px', width: '40%', background: 'rgba(255,255,255,0.08)', borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ position: 'absolute', bottom: '20px', right: '20px', height: '40px', width: '100px', background: 'var(--primary)', borderRadius: '8px', opacity: 0.5 }} />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section style={{ padding: '120px 24px', textAlign: 'center' }}>
                <motion.div
                    className="glass-card"
                    style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 40px', position: 'relative', overflow: 'hidden' }}
                    whileInView={{ scale: [0.95, 1] }}
                    viewport={{ once: true }}
                >
                    <div style={{ position: 'absolute', top: '-50%', right: '-30%', width: '500px', height: '500px', background: 'var(--primary)', filter: 'blur(150px)', opacity: 0.1 }} />
                    <h2 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '24px' }}>Ready to Simplify Your <span className="gradient-text">Policy Experience?</span></h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '18px', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Join thousands of users who are already using PolicyMitr to understand and manage government policies effortlessly.
                    </p>
                    <button className="btn-gradient" style={{ padding: '16px 48px', fontSize: '18px' }} onClick={() => navigate(user ? '/dashboard' : '/login')}>
                        {user ? 'Go to Dashboard' : 'Get Started Free Now'}
                    </button>
                </motion.div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer style={{
                padding: '80px 24px 40px',
                textAlign: 'center',
                borderTop: '1px solid var(--border-dark)',
                background: '#010413'
            }}>
                <div style={{ fontSize: '24px', fontWeight: 900, marginBottom: '32px' }}><span style={{ color: 'var(--primary)' }}>Policy</span>Mitr</div>
                <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
                    <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '15px', textDecoration: 'none' }}>Privacy Policy</a>
                    <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '15px', textDecoration: 'none' }}>Terms of Service</a>
                    <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '15px', textDecoration: 'none' }}>Legal Documentation</a>
                    <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '15px', textDecoration: 'none' }}>Contact Support</a>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    © 2025 PolicyMitr AI. All rights reserved. Built for accuracy, transparency, and accessibility.
                </p>
            </footer>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.4); }
                    70% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 0 10px rgba(14, 165, 233, 0); }
                    100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(14, 165, 233, 0); }
                }
            `}</style>
        </div>
    );
}
