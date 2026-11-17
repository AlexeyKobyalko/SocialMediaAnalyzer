import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const fetchPosts = (search) => {
    const params = {};
    if (search && search.trim()) {
        params.search = search.trim();
    }
    return api.get('/posts', { params });
};

export const createPost = (postData) => api.post('/posts', postData);
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData);
export const deletePost = (id) => api.delete(`/posts/${id}`);

export const addComment = (postId, commentData) =>
    api.post(`/posts/${postId}/comments`, commentData);
export const updateComment = (postId, commentId, commentData) =>
    api.put(`/posts/${postId}/comments/${commentId}`, commentData);
export const updateCommentLikes = (postId, commentId, payload = { delta: 1 }) =>
    api.patch(`/posts/${postId}/comments/${commentId}/likes`, payload);
export const deleteComment = (postId, commentId) =>
    api.delete(`/posts/${postId}/comments/${commentId}`);

export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);
export const getProfile = () => api.get('/auth/profile');

export default api;
