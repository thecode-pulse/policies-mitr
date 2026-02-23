import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBookmark } from 'react-icons/fi';

export default function Bookmarks() {
    const [bookmarks, setBookmarks] = useState([]);

    return (
        <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
                <FiBookmark style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                Bookmarks
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Your saved policy clauses and documents.
            </p>

            <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Bookmark clauses from any policy viewer to see them here.
                </p>
            </div>
        </div>
    );
}
