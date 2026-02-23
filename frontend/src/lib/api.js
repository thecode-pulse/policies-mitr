import axios from 'axios';
import { supabase } from './supabase';

const API_BASE = '/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 120000, // 2 min for long AI processing
});

// Attach auth token to every request
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

// ───── Auth ─────
export const getProfile = () => api.get('/auth/profile');
export const updateProfile = (data) => api.put('/auth/profile', data);

// ───── Policies ─────
export const uploadPolicy = async (file, title, language, privacyMode) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || '');
    formData.append('language', language || 'en');
    formData.append('privacy_mode', privacyMode ? 'true' : 'false');

    return api.post('/policies/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};
export const listPolicies = () => api.get('/policies/');
export const getPolicy = (id) => api.get(`/policies/${id}`);
export const deletePolicy = (id) => api.delete(`/policies/${id}`);
export const toggleBookmark = (id) => api.post(`/policies/${id}/bookmark`);
export const comparePolicies = (idA, idB) =>
    api.post('/policies/compare', { policy_id_a: idA, policy_id_b: idB });

// ───── AI ─────
export const chat = (query, policyId) =>
    api.post('/ai/chat', { query, policy_id: policyId || null });
export const translateText = (text, targetLang) =>
    api.post('/ai/translate', { text, target_language: targetLang });
export const textToSpeech = (text, language) =>
    api.post('/ai/tts', { text, language }, { responseType: 'blob' });
export const getRecommendations = (policyId) =>
    api.get(`/ai/recommendations/${policyId}`);

// ───── Admin ─────
export const getAnalytics = () => api.get('/admin/analytics');
export const getUsers = () => api.get('/admin/users');
export const getActivity = () => api.get('/admin/activity');

// ───── Health ─────
export const healthCheck = () => api.get('/health');

export default api;
