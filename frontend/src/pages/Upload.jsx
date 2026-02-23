import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { uploadPolicy } from '../lib/api';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

export default function Upload() {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('en');
    const [privacyMode, setPrivacyMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileRef = useRef();
    const navigate = useNavigate();

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) setFile(f);
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }
        setLoading(true);
        setProgress(10);
        setStatus('📤 Uploading document...');

        try {
            const progressSteps = [
                { pct: 20, msg: '📄 Extracting text from document...' },
                { pct: 40, msg: '🤖 AI is analyzing the policy...' },
                { pct: 60, msg: '📋 Extracting clauses...' },
                { pct: 80, msg: '💾 Saving to database...' },
                { pct: 90, msg: '✨ Almost done...' },
            ];

            let stepIdx = 0;
            const interval = setInterval(() => {
                if (stepIdx < progressSteps.length) {
                    setProgress(progressSteps[stepIdx].pct);
                    setStatus(progressSteps[stepIdx].msg);
                    stepIdx++;
                }
            }, 1500);

            const res = await uploadPolicy(file, title || file.name, language, privacyMode);
            clearInterval(interval);
            setProgress(100);
            setStatus('✅ Analysis complete!');
            toast.success('Policy processed successfully! 🎉');

            setTimeout(() => {
                navigate(`/policy/${res.data.id}`);
            }, 800);
        } catch (err) {
            const detail = err?.response?.data?.detail || 'Upload failed. Make sure the backend is running.';
            toast.error(detail);
            setStatus(`❌ Error: ${detail}`);
            setProgress(0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                    📤 Upload Policy Document
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                    Upload a PDF or image of a government policy. Our AI will analyze, summarize, and explain every clause.
                </p>

                {/* Drop Zone */}
                <div
                    className={`upload-zone ${dragOver ? 'dragover' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !loading && fileRef.current?.click()}
                    style={{ cursor: loading ? 'default' : 'pointer' }}
                >
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => setFile(e.target.files[0])}
                    />
                    <AnimatePresence mode="wait">
                        {file ? (
                            <motion.div key="file" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <FiFile size={48} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
                                <p style={{ fontWeight: 700, fontSize: '16px' }}>{file.name}</p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'document'}
                                </p>
                                {!loading && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                        style={{
                                            marginTop: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                            color: '#ef4444', padding: '8px 20px', borderRadius: '10px', cursor: 'pointer',
                                            fontWeight: 600, fontSize: '13px',
                                        }}
                                    >
                                        <FiX size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Remove File
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <FiUploadCloud size={56} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                                <p style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>
                                    Drop your policy document here
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    or click to browse • Supports <strong>PDF, PNG, JPG</strong>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Options */}
                <div style={{ marginTop: '24px', display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-primary)' }}>
                            📝 Policy Title
                        </label>
                        <input
                            className="input-field"
                            placeholder="e.g. PM Awas Yojana 2024, Beti Bachao Beti Padhao..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                                🌐 Document Language
                            </label>
                            <select
                                className="input-field"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                disabled={loading}
                            >
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="mr">Marathi</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'end', paddingBottom: '4px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                                <input
                                    type="checkbox"
                                    checked={privacyMode}
                                    onChange={(e) => setPrivacyMode(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                    disabled={loading}
                                />
                                🔒 Privacy Mode
                            </label>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '24px' }}
                    >
                        <div className="progress-bar" style={{ height: '8px', marginBottom: '12px' }}>
                            <motion.div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}>
                                {status}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Submit */}
                <motion.button
                    className="btn-gradient"
                    style={{
                        width: '100%', marginTop: '24px', opacity: loading ? 0.7 : 1,
                        fontSize: '16px', padding: '16px',
                    }}
                    onClick={handleUpload}
                    disabled={loading || !file}
                    whileHover={!loading ? { scale: 1.02 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                >
                    {loading ? '⏳ Processing...' : '🚀 Upload & Analyze'}
                </motion.button>

                {/* Info */}
                <div style={{
                    marginTop: '20px', padding: '16px', borderRadius: '12px',
                    background: 'rgba(14,165,233,0.05)', border: '1px solid rgba(14,165,233,0.15)',
                }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <FiAlertCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }} />
                        <strong>How it works:</strong> Your document is parsed, then analyzed by AI to extract a summary,
                        simplified explanation, clause-by-clause breakdown, Hindi translation, and difficulty score.
                        You can then chat with the AI about your policy.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
