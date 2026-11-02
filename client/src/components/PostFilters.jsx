import { PLATFORMS, SENTIMENTS } from '../data/initialPosts';

function PostFilters({ filters, searchInput, onSearchChange, onChange }) {
    const handleChange = (event) => {
        const { name, value } = event.target;
        onChange({ ...filters, [name]: value });
    };

    return (
        <div className="filters-card">
            <div className="search-wrap">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Поиск постов на сервере (debounce)..."
                    value={searchInput}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="filters-grid">
                <div className="filter-item">
                    <label>Платформа</label>
                    <select name="platform" value={filters.platform} onChange={handleChange}>
                        <option value="all">Все платформы</option>
                        {PLATFORMS.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label>Тональность</label>
                    <select name="sentiment" value={filters.sentiment} onChange={handleChange}>
                        <option value="all">Любая</option>
                        {SENTIMENTS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label>Сортировка</label>
                    <select name="sortBy" value={filters.sortBy} onChange={handleChange}>
                        <option value="id">По порядку (ID)</option>
                        <option value="likes">По лайкам</option>
                        <option value="views">По просмотрам</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export default PostFilters;