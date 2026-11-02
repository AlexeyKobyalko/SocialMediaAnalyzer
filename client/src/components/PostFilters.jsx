import { PLATFORMS, SENTIMENTS } from '../data/initialPosts';

function PostFilters({ filters, searchInput, onSearchChange, onChange }) {
    const handleChange = (event) => {
        const { name, value } = event.target;
        onChange({ ...filters, [name]: value });
    };

    return (
        <div className="filters-wrapper">
            <div className="search-box">
                <label>
                    Поиск по тексту (на сервере с Debounce)
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Введите ключевое слово для поиска..."
                        value={searchInput}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </label>
            </div>

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
        </div>
    );
}

export default PostFilters;