import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchPosts, createPost, updatePost, deletePost } from '../api';
import PostForm from './PostForm';
import PostFilters from './PostFilters';
import AuthBar from './AuthBar';

function PostList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionNotice, setActionNotice] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [editingPost, setEditingPost] = useState(null);
    const [filters, setFilters] = useState({
        platform: 'all',
        sentiment: 'all',
        sortBy: 'id',
    });

    const showNotification = (message, isError = false) => {
        setActionNotice({ message, isError });
        setTimeout(() => {
            setActionNotice(null);
        }, 4000);
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchInput);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchInput]);

    const loadPosts = useCallback(async (searchQuery) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchPosts(searchQuery);
            setPosts(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Не удалось загрузить данные с сервера');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts(debouncedSearch);
    }, [debouncedSearch, loadPosts]);

    useEffect(() => {
        document.title = `SMA Dashboard (${posts.length})`;
    }, [posts.length]);

    const stats = useMemo(() => {
        const bySentiment = { positive: 0, neutral: 0, negative: 0 };
        let totalLikes = 0;
        let totalViews = 0;

        for (const post of posts) {
            if (bySentiment[post.sentiment] !== undefined) {
                bySentiment[post.sentiment] += 1;
            }
            totalLikes += Number(post.likes) || 0;
            totalViews += Number(post.views) || 0;
        }

        return {
            total: posts.length,
            bySentiment,
            totalLikes,
            totalViews,
        };
    }, [posts]);

    const visiblePosts = useMemo(() => {
        let result = posts.filter((post) => {
            if (filters.platform !== 'all' && post.platform !== filters.platform) {
                return false;
            }
            if (filters.sentiment !== 'all' && post.sentiment !== filters.sentiment) {
                return false;
            }
            return true;
        });

        result = [...result].sort((a, b) => {
            if (filters.sortBy === 'likes') return b.likes - a.likes;
            if (filters.sortBy === 'views') return b.views - a.views;
            return a.id - b.id;
        });

        return result;
    }, [posts, filters]);

    const handleSubmit = async (formData) => {
        if (editingPost) {
            const previousPosts = [...posts];
            const targetId = editingPost.id;

            setPosts((prev) =>
                prev.map((post) =>
                    post.id === targetId ? { ...post, ...formData } : post
                )
            );
            setEditingPost(null);

            try {
                const response = await updatePost(targetId, formData);
                setPosts((prev) =>
                    prev.map((post) => (post.id === targetId ? response.data : post))
                );
                showNotification('Пост успешно обновлен на сервере');
            } catch (err) {
                setPosts(previousPosts);
                showNotification(
                    err.response?.data?.error || 'Ошибка при обновлении. Изменения откатаны.',
                    true
                );
            }
            return;
        }

        const tempId = Date.now();
        const optimisticPost = {
            id: tempId,
            ...formData,
            createdAt: new Date().toISOString(),
        };

        setPosts((prev) => [optimisticPost, ...prev]);

        try {
            const response = await createPost(formData);
            setPosts((prev) =>
                prev.map((post) => (post.id === tempId ? response.data : post))
            );
            showNotification('Пост успешно создан на сервере');
        } catch (err) {
            setPosts((prev) => prev.filter((post) => post.id !== tempId));
            showNotification(
                err.response?.data?.error || 'Ошибка добавления поста. Откат.',
                true
            );
        }
    };

    const handleDelete = async (id) => {
        const previousPosts = [...posts];
        const postToDelete = posts.find((p) => p.id === id);

        setPosts((prev) => prev.filter((post) => post.id !== id));
        if (editingPost?.id === id) {
            setEditingPost(null);
        }

        try {
            await deletePost(id);
            showNotification('Пост успешно удален с сервера');
        } catch (err) {
            setPosts(previousPosts);
            showNotification(
                err.response?.data?.error || 'Не удалось удалить пост. Откат изменений.',
                true
            );
        }
    };

    return (
        <div className="dashboard-container">
            <header className="brand-header">
                <div>
                    <span className="brand-tag">Analytics Hub</span>
                    <h1 className="brand-title">Social Media Analyzer</h1>
                </div>
            </header>

            <AuthBar onAuthChange={() => loadPosts(debouncedSearch)} />

            {actionNotice && (
                <div
                    className={`toast-banner ${
                        actionNotice.isError ? 'toast-error' : 'toast-success'
                    }`}
                >
                    {actionNotice.message}
                </div>
            )}

            <div className="stats-row">
                <div className="stat-card stat-card-lime">
                    <div className="stat-card-top">
                        <span className="stat-card-label">Всего публикаций</span>
                        <span className="stat-pill-badge">Live DB</span>
                    </div>
                    <div className="stat-card-value">{stats.total}</div>
                    <div className="stat-card-sub">
                        Позитивных: {stats.bySentiment.positive} · Нейтральных:{' '}
                        {stats.bySentiment.neutral}
                    </div>
                </div>

                <div className="stat-card stat-card-emerald">
                    <div className="stat-card-top">
                        <span className="stat-card-label">Охват и вовлечение</span>
                        <span className="stat-pill-badge emerald">Metrics</span>
                    </div>
                    <div className="stat-card-value">{stats.totalLikes.toLocaleString()}</div>
                    <div className="stat-card-sub">
                        Суммарно лайков · {stats.totalViews.toLocaleString()} просмотров
                    </div>
                </div>

                <div className="stat-card stat-card-pink">
                    <div className="stat-card-top">
                        <span className="stat-card-label">Негатив / Риски</span>
                        <span className="stat-pill-badge pink">Alerts</span>
                    </div>
                    <div className="stat-card-value">{stats.bySentiment.negative}</div>
                    <div className="stat-card-sub">
                        Требуют внимания модератора
                    </div>
                </div>
            </div>

            <PostForm
                editingPost={editingPost}
                onSubmit={handleSubmit}
                onCancel={() => setEditingPost(null)}
            />

            <PostFilters
                filters={filters}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onChange={setFilters}
            />

            {loading && (
                <div className="state-panel loading-state">
                    <div className="pulse-loader"></div>
                    <span>Синхронизация с сервером...</span>
                </div>
            )}

            {error && !loading && (
                <div className="state-panel error-state">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="btn btn-lime"
                        onClick={() => loadPosts(debouncedSearch)}
                    >
                        Повторить запрос
                    </button>
                </div>
            )}

            {!loading && !error && (
                <div className="posts-stream">
                    {visiblePosts.length === 0 && (
                        <div className="posts-empty-card">
                            Публикаций по выбранным критериям не найдено
                        </div>
                    )}

                    {visiblePosts.map((post) => (
                        <article
                            key={post.id}
                            className={`stream-item sentiment-${post.sentiment}`}
                        >
                            <div className="item-header">
                                <div className="item-badges">
                                    <span className="pill-badge badge-platform">{post.platform}</span>
                                    <span className={`pill-badge badge-sentiment-${post.sentiment}`}>
                    {post.sentiment}
                  </span>
                                </div>
                                <div className="item-metrics">
                                    <span>♥ {post.likes}</span>
                                    <span>👁 {post.views}</span>
                                </div>
                            </div>

                            <p className="item-text">{post.text}</p>

                            <div className="item-actions">
                                <button
                                    type="button"
                                    className="btn btn-action-ghost"
                                    onClick={() => setEditingPost(post)}
                                >
                                    Редактировать
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-action-danger"
                                    onClick={() => handleDelete(post.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PostList;