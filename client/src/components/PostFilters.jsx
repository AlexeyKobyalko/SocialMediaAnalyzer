import { PLATFORMS, SENTIMENTS } from '../data/initialPosts';

/**
 * Фильтр по platform / sentiment и сортировка по likes / views.
 */
function PostFilters({ filters, onChange }) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="post-filters">
      <label>
        Платформа
        <select name="platform" value={filters.platform} onChange={handleChange}>
          <option value="all">Все</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label>
        Тональность
        <select name="sentiment" value={filters.sentiment} onChange={handleChange}>
          <option value="all">Все</option>
          {SENTIMENTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label>
        Сортировка
        <select name="sortBy" value={filters.sortBy} onChange={handleChange}>
          <option value="id">По ID</option>
          <option value="likes">По лайкам</option>
          <option value="views">По просмотрам</option>
        </select>
      </label>
    </div>
  );
}

export default PostFilters;
