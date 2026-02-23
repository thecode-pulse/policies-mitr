import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2 } from 'react-icons/fi';

export default function Analytics() {
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
                    Analytics will appear as you process more policies.
                </p>
            </div>
        </div>
    );
}
