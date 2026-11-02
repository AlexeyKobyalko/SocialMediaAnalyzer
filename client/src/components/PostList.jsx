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
        document.title = `Social Media Analyzer (${posts.length} постов)`;
    }, [posts.length]);

    const stats = useMemo(() => {
        const bySentiment = { positive: 0, neutral: 0, negative: 0 };
        let totalLikes = 0;

        for (const post of posts) {
            if (bySentiment[post.sentiment] !== undefined) {
                bySentiment[post.sentiment] += 1;
            }
            totalLikes += Number(post.likes) || 0;
        }

        return {
            total: posts.length,
            bySentiment,
            totalLikes,
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
                err.response?.data?.error || 'Ошибка при добавлении поста. Откат.',
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
        <div className="post-list">
            <header className="app-header">
                <h1>Social Media Analyzer</h1>
                <p>Интеграция с REST API и оптимистичное обновление. Лабораторная №5.</p>
            </header>

            <AuthBar onAuthChange={() => loadPosts(debouncedSearch)} />

            {actionNotice && (
                <div
                    className={`action-banner ${actionNotice.isError ? 'banner-error' : 'banner-success'}`}
                >
                    {actionNotice.message}
                </div>
            )}

            <section className="stats" aria-label="Статистика">
                <span>Всего: <strong>{stats.total}</strong></span>
                <span>Позитивных: <strong>{stats.bySentiment.positive}</strong></span>
                <span>Нейтральных: <strong>{stats.bySentiment.neutral}</strong></span>
                <span>Негативных: <strong>{stats.bySentiment.negative}</strong></span>
                <span>Сумма лайков: <strong>{stats.totalLikes}</strong></span>
            </section>

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
                <div className="status-box loading-box">
                    <div className="spinner"></div>
                    <span>Загрузка данных с сервера...</span>
                </div>
            )}

            {error && !loading && (
                <div className="status-box error-box">
                    <p>{error}</p>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => loadPosts(debouncedSearch)}
                    >
                        Повторить
                    </button>
                </div>
            )}

            {!loading && !error && (
                <ul className="posts">
                    {visiblePosts.length === 0 && (
                        <li className="posts-empty">Постов не найдено</li>
                    )}
                    {visiblePosts.map((post) => (
                        <li key={post.id} className={`post-item sentiment-${post.sentiment}`}>
                            <div className="post-meta">
                                <span className="badge platform">{post.platform}</span>
                                <span className="badge sentiment">{post.sentiment}</span>
                                <span className="metrics">
                  likes {post.likes} · views {post.views}
                </span>
                            </div>
                            <p className="post-text">{post.text}</p>
                            <div className="post-actions">
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => setEditingPost(post)}
                                >
                                    Редактировать
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(post.id)}
                                >
                                    Удалить
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default PostList;