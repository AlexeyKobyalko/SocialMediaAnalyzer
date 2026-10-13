import { useState, useEffect } from 'react';
import { PLATFORMS, SENTIMENTS } from '../data/initialPosts';

const EMPTY_FORM = {
  text: '',
  platform: 'Twitter',
  sentiment: 'neutral',
  likes: 0,
  views: 0,
};

/**
 * Контролируемая форма добавления / редактирования поста.
 * Enter в поле текста — submit (горячая клавиша из контрольных вопросов).
 */
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
      ...form,
      text,
      likes: Number(form.likes) || 0,
      views: Number(form.views) || 0,
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
    <form className="post-form" onSubmit={handleSubmit}>
      <h2>{editingPost ? 'Редактировать пост' : 'Добавить пост'}</h2>

      <label>
        Текст
        <textarea
          name="text"
          value={form.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder="Текст поста… (Enter — сохранить)"
          required
        />
      </label>

      <div className="form-row">
        <label>
          Платформа
          <select name="platform" value={form.platform} onChange={handleChange}>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label>
          Тональность
          <select name="sentiment" value={form.sentiment} onChange={handleChange}>
            {SENTIMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Лайки
          <input
            type="number"
            name="likes"
            min="0"
            value={form.likes}
            onChange={handleChange}
          />
        </label>

        <label>
          Просмотры
          <input
            type="number"
            name="views"
            min="0"
            value={form.views}
            onChange={handleChange}
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {editingPost ? 'Сохранить' : 'Добавить'}
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
