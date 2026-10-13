import { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { INITIAL_POSTS, STORAGE_KEY } from '../data/initialPosts';
import PostForm from './PostForm';
import PostFilters from './PostFilters';

/**
 * Главный компонент предметной области: список постов соцсетей.
 * useState — форма, фильтры, редактирование.
 * useLocalStorage — массив постов + debounce-сохранение в localStorage.
 */
function PostList() {
  const [posts, setPosts] = useLocalStorage(STORAGE_KEY, INITIAL_POSTS, 500);
  const [editingPost, setEditingPost] = useState(null);
  const [filters, setFilters] = useState({
    platform: 'all',
    sentiment: 'all',
    sortBy: 'id',
  });

  // Побочный эффект: заголовок вкладки зависит от количества постов
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

  const handleSubmit = (formData) => {
    if (editingPost) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id ? { ...post, ...formData } : post
        )
      );
      setEditingPost(null);
      return;
    }

    setPosts((prev) => {
      const nextId = prev.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      return [...prev, { id: nextId, ...formData }];
    });
  };

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((post) => post.id !== id));
    if (editingPost?.id === id) {
      setEditingPost(null);
    }
  };

  return (
    <div className="post-list">
      <header className="app-header">
        <h1>Social Media Analyzer</h1>
        <p>Локальное управление постами (localStorage). Лабораторная №4.</p>
      </header>

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

      <PostFilters filters={filters} onChange={setFilters} />

      <ul className="posts">
        {visiblePosts.length === 0 && (
          <li className="posts-empty">Нет постов по выбранным фильтрам</li>
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
    </div>
  );
}

export default PostList;
