import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    addComment,
    updateComment,
    updateCommentLikes,
    deleteComment,
} from '../api';
import { SENTIMENTS } from '../data/initialPosts';
import AnalyticsCharts from './AnalyticsCharts';
import PostForm from './PostForm';
import PostFilters from './PostFilters';

const EMPTY_COMMENT_DRAFT = {
    author: '',
    text: '',
    sentiment: 'neutral',
    likes: 0,
};

function PostList({ currentUser }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionNotice, setActionNotice] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [editingPost, setEditingPost] = useState(null);
    const [expandedPosts, setExpandedPosts] = useState({});
    const [commentDrafts, setCommentDrafts] = useState({});
    const [editingComment, setEditingComment] = useState(null);

    const [filters, setFilters] = useState({
        platform: 'all',
        sentiment: 'all',
        sortBy: 'id',
    });

    const isAdmin = currentUser?.role === 'admin';

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
            return (b.id || '').localeCompare(a.id || '');
        });

        return result;
    }, [posts, filters]);

    const replacePostInState = (updatedPost) => {
        setPosts((prev) =>
            prev.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
    };

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
                replacePostInState(response.data);
                showNotification('Пост успешно обновлен в MongoDB');
            } catch (err) {
                setPosts(previousPosts);
                showNotification(
                    err.response?.data?.error || 'Ошибка при обновлении. Изменения откатаны.',
                    true
                );
            }
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const optimisticPost = {
            id: tempId,
            ...formData,
            tags: formData.tags || [],
            comments: [],
            createdAt: new Date().toISOString(),
        };

        setPosts((prev) => [optimisticPost, ...prev]);

        try {
            const response = await createPost(formData);
            setPosts((prev) =>
                prev.map((post) => (post.id === tempId ? response.data : post))
            );
            showNotification('Пост успешно создан в MongoDB');
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

        setPosts((prev) => prev.filter((post) => post.id !== id));
        if (editingPost?.id === id) {
            setEditingPost(null);
        }

        try {
            await deletePost(id);
            showNotification('Пост успешно удален из MongoDB');
        } catch (err) {
            setPosts(previousPosts);
            showNotification(
                err.response?.data?.error || 'Не удалось удалить пост. Откат изменений.',
                true
            );
        }
    };

    const toggleComments = (postId) => {
        setExpandedPosts((prev) => ({
            ...prev,
            [postId]: !prev[postId],
        }));
    };

    const getDraft = (postId) => commentDrafts[postId] || EMPTY_COMMENT_DRAFT;

    const handleDraftChange = (postId, field, value) => {
        setCommentDrafts((prev) => ({
            ...prev,
            [postId]: {
                ...getDraft(postId),
                [field]: value,
            },
        }));
    };

    const handleAddComment = async (event, postId) => {
        event.preventDefault();
        const draft = getDraft(postId);
        const text = draft.text.trim();
        if (!text) return;

        try {
            const response = await addComment(postId, {
                author: draft.author.trim() || 'Аноним',
                text,
                sentiment: draft.sentiment,
                likes: Number(draft.likes) || 0,
            });
            replacePostInState(response.data.post);
            setCommentDrafts((prev) => ({
                ...prev,
                [postId]: EMPTY_COMMENT_DRAFT,
            }));
            showNotification('Комментарий добавлен во вложенный массив MongoDB');
        } catch (err) {
            showNotification(
                err.response?.data?.error || 'Не удалось добавить комментарий',
                true
            );
        }
    };

    const startEditComment = (postId, comment) => {
        const commentId = comment._id || comment.id;
        setEditingComment({
            postId,
            commentId,
            author: comment.author || 'Аноним',
            text: comment.text || '',
            sentiment: comment.sentiment || 'neutral',
            likes: Number(comment.likes) || 0,
        });
    };

    const handleSaveComment = async (event) => {
        event.preventDefault();
        if (!editingComment || !editingComment.text.trim()) return;

        try {
            const response = await updateComment(
                editingComment.postId,
                editingComment.commentId,
                {
                    author: editingComment.author.trim() || 'Аноним',
                    text: editingComment.text.trim(),
                    sentiment: editingComment.sentiment,
                    likes: Math.max(0, Number(editingComment.likes) || 0),
                }
            );
            replacePostInState(response.data.post);
            setEditingComment(null);
            showNotification('Комментарий обновлен в MongoDB');
        } catch (err) {
            showNotification(
                err.response?.data?.error || 'Не удалось обновить комментарий',
                true
            );
        }
    };

    const handleIncrementCommentLikes = async (postId, commentId) => {
        try {
            const response = await updateCommentLikes(postId, commentId, { delta: 1 });
            replacePostInState(response.data.post);
            showNotification('Счетчик лайков комментария увеличен');
        } catch (err) {
            showNotification(
                err.response?.data?.error || 'Не удалось обновить лайки комментария',
                true
            );
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const response = await deleteComment(postId, commentId);
            replacePostInState(response.data.post);
            if (editingComment?.commentId === commentId) {
                setEditingComment(null);
            }
            showNotification('Комментарий удален из вложенного массива');
        } catch (err) {
            showNotification(
                err.response?.data?.error || 'Не удалось удалить комментарий',
                true
            );
        }
    };

    return (
        <div className="dashboard-content">
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
                        <span className="stat-pill-badge">MongoDB Live</span>
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

            <AnalyticsCharts posts={posts} />

            {isAdmin && (
                <PostForm
                    editingPost={editingPost}
                    onSubmit={handleSubmit}
                    onCancel={() => setEditingPost(null)}
                />
            )}

            <PostFilters
                filters={filters}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onChange={setFilters}
            />

            {loading && (
                <div className="state-panel loading-state">
                    <div className="pulse-loader"></div>
                    <span>Синхронизация с MongoDB...</span>
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

                    {visiblePosts.map((post) => {
                        const comments = post.comments || [];
                        const isExpanded = Boolean(expandedPosts[post.id]);
                        const draft = getDraft(post.id);

                        return (
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
                                        <span>💬 {comments.length}</span>
                                    </div>
                                </div>

                                <p className="item-text">{post.text}</p>

                                {post.tags && post.tags.length > 0 && (
                                    <div className="post-tags-list">
                                        {post.tags.map((tag, idx) => (
                                            <span key={idx} className="post-tag-chip">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="item-actions">
                                    <button
                                        type="button"
                                        className="btn-action-ghost"
                                        onClick={() => toggleComments(post.id)}
                                    >
                                        {isExpanded
                                            ? `Скрыть комментарии (${comments.length})`
                                            : `Комментарии (${comments.length})`}
                                    </button>

                                    {isAdmin && (
                                        <>
                                            <button
                                                type="button"
                                                className="btn-action-ghost"
                                                onClick={() => setEditingPost(post)}
                                            >
                                                Редактировать
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-action-danger"
                                                onClick={() => handleDelete(post.id)}
                                            >
                                                Удалить
                                            </button>
                                        </>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="comments-panel">
                                        {comments.length === 0 ? (
                                            <p className="comments-empty">
                                                Вложенных комментариев пока нет
                                            </p>
                                        ) : (
                                            <div className="comments-list">
                                                {comments.map((comment) => {
                                                    const commentId = comment._id || comment.id;
                                                    const isEditingThis =
                                                        editingComment?.postId === post.id &&
                                                        editingComment?.commentId === commentId;

                                                    return (
                                                        <div key={commentId} className="comment-card">
                                                            {isEditingThis ? (
                                                                <form
                                                                    className="comment-edit-form"
                                                                    onSubmit={handleSaveComment}
                                                                >
                                                                    <div className="comment-form-row">
                                                                        <input
                                                                            type="text"
                                                                            value={editingComment.author}
                                                                            onChange={(e) =>
                                                                                setEditingComment((prev) => ({
                                                                                    ...prev,
                                                                                    author: e.target.value,
                                                                                }))
                                                                            }
                                                                            placeholder="Автор"
                                                                        />
                                                                        <select
                                                                            value={editingComment.sentiment}
                                                                            onChange={(e) =>
                                                                                setEditingComment((prev) => ({
                                                                                    ...prev,
                                                                                    sentiment: e.target.value,
                                                                                }))
                                                                            }
                                                                        >
                                                                            {SENTIMENTS.map((s) => (
                                                                                <option key={s} value={s}>
                                                                                    {s}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            value={editingComment.likes}
                                                                            onChange={(e) =>
                                                                                setEditingComment((prev) => ({
                                                                                    ...prev,
                                                                                    likes: Number(e.target.value) || 0,
                                                                                }))
                                                                            }
                                                                            title="Лайки комментария"
                                                                        />
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={editingComment.text}
                                                                        onChange={(e) =>
                                                                            setEditingComment((prev) => ({
                                                                                ...prev,
                                                                                text: e.target.value,
                                                                            }))
                                                                        }
                                                                        placeholder="Текст комментария"
                                                                        required
                                                                    />
                                                                    <div className="comment-actions">
                                                                        <button type="submit" className="btn-mini btn-mini-lime">
                                                                            Сохранить
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="btn-mini"
                                                                            onClick={() => setEditingComment(null)}
                                                                        >
                                                                            Отмена
                                                                        </button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <>
                                                                    <div className="comment-header">
                                                                        <div className="comment-meta">
                                                                            <span className="comment-author">
                                                                                {comment.author || 'Аноним'}
                                                                            </span>
                                                                            <span
                                                                                className={`pill-badge badge-sentiment-${comment.sentiment || 'neutral'}`}
                                                                            >
                                                                                {comment.sentiment || 'neutral'}
                                                                            </span>
                                                                        </div>
                                                                        <span className="comment-likes-stat">
                                                                            ♥ {comment.likes || 0}
                                                                        </span>
                                                                    </div>
                                                                    <p className="comment-text">{comment.text}</p>
                                                                    {isAdmin && (
                                                                        <div className="comment-actions">
                                                                            <button
                                                                                type="button"
                                                                                className="btn-mini"
                                                                                onClick={() =>
                                                                                    handleIncrementCommentLikes(post.id, commentId)
                                                                                }
                                                                                title="Увеличить счетчик лайков комментария"
                                                                            >
                                                                                ♥ +1 к метрике
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-mini"
                                                                                onClick={() => startEditComment(post.id, comment)}
                                                                            >
                                                                                Изменить
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                className="btn-mini btn-mini-danger"
                                                                                onClick={() =>
                                                                                    handleDeleteComment(post.id, commentId)
                                                                                }
                                                                            >
                                                                                Удалить
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {isAdmin && (
                                            <form
                                                className="comment-form"
                                                onSubmit={(e) => handleAddComment(e, post.id)}
                                            >
                                                <div className="comment-form-row">
                                                    <input
                                                        type="text"
                                                        value={draft.author}
                                                        onChange={(e) =>
                                                            handleDraftChange(post.id, 'author', e.target.value)
                                                        }
                                                        placeholder="Автор (по умолчанию Аноним)"
                                                    />
                                                    <select
                                                        value={draft.sentiment}
                                                        onChange={(e) =>
                                                            handleDraftChange(post.id, 'sentiment', e.target.value)
                                                        }
                                                    >
                                                        {SENTIMENTS.map((s) => (
                                                            <option key={s} value={s}>
                                                                {s}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={draft.likes}
                                                        onChange={(e) =>
                                                            handleDraftChange(post.id, 'likes', e.target.value)
                                                        }
                                                        placeholder="Лайки"
                                                        title="Количество лайков комментария"
                                                    />
                                                </div>
                                                <div className="comment-submit-row">
                                                    <input
                                                        type="text"
                                                        value={draft.text}
                                                        onChange={(e) =>
                                                            handleDraftChange(post.id, 'text', e.target.value)
                                                        }
                                                        placeholder="Текст комментария из соцсети..."
                                                        required
                                                    />
                                                    <button type="submit" className="btn btn-lime btn-comment-add">
                                                        Добавить комментарий
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default PostList;
