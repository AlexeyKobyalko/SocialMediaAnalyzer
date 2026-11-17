import { useState, useEffect } from 'react';
import { PLATFORMS, SENTIMENTS } from '../data/initialPosts';

const EMPTY_FORM = {
    text: '',
    platform: 'Twitter',
    sentiment: 'neutral',
    likes: 0,
    views: 0,
    tagsInput: '',
};

function parseTags(rawTags) {
    const seen = new Set();
    const result = [];
    for (const part of rawTags.split(',')) {
        const cleaned = part.trim().replace(/^#+/, '');
        if (cleaned && !seen.has(cleaned)) {
            seen.add(cleaned);
            result.push(cleaned);
        }
    }
    return result;
}

function PostForm({ editingPost, onSubmit, onCancel }) {
    const [form, setForm] = useState(EMPTY_FORM);

    useEffect(() => {
        if (editingPost) {
            setForm({
                text: editingPost.text,
                platform: editingPost.platform,
                sentiment: editingPost.sentiment,
                likes: editingPost.likes,
                views: editingPost.views,
                tagsInput: Array.isArray(editingPost.tags) ? editingPost.tags.join(', ') : '',
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [editingPost]);

    const handleChange = (event) => {
        const { name, value, type } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'number' ? Number(value) || 0 : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const text = form.text.trim();
        if (!text) return;

        onSubmit({
            text,
            platform: form.platform,
            sentiment: form.sentiment,
            likes: Number(form.likes) || 0,
            views: Number(form.views) || 0,
            tags: parseTags(form.tagsInput),
        });

        if (!editingPost) {
            setForm(EMPTY_FORM);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
        }
    };

    return (
        <form className="panel-card post-form" onSubmit={handleSubmit}>
            <div className="panel-header">
                <h2>{editingPost ? 'Редактирование публикации' : 'Новая публикация'}</h2>
            </div>

            <div className="input-group">
                <textarea
                    name="text"
                    value={form.text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    rows={3}
                    placeholder="Напишите текст поста для анализа..."
                    required
                />
            </div>

            <div className="form-grid">
                <div className="input-group">
                    <label>Платформа</label>
                    <select name="platform" value={form.platform} onChange={handleChange}>
                        {PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>Тональность</label>
                    <select name="sentiment" value={form.sentiment} onChange={handleChange}>
                        {SENTIMENTS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <label>Лайки</label>
                    <input
                        type="number"
                        name="likes"
                        min="0"
                        value={form.likes}
                        onChange={handleChange}
                    />
                </div>

                <div className="input-group">
                    <label>Просмотры</label>
                    <input
                        type="number"
                        name="views"
                        min="0"
                        value={form.views}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="input-group form-tags-group">
                <label>Теги (через запятую)</label>
                <input
                    type="text"
                    name="tagsInput"
                    value={form.tagsInput}
                    onChange={handleChange}
                    placeholder="Например: релиз, аналитика, тренд"
                />
            </div>

            <div className="form-footer">
                <button type="submit" className="btn btn-lime">
                    {editingPost ? 'Сохранить изменения' : 'Опубликовать'}
                </button>
                {editingPost && (
                    <button type="button" className="btn btn-ghost" onClick={onCancel}>
                        Отмена
                    </button>
                )}
            </div>
        </form>
    );
}

export default PostForm;
