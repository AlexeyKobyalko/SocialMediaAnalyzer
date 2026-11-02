import { useMemo } from 'react';

function AnalyticsCharts({ posts }) {
    const barData = useMemo(() => {
        const platforms = ['Twitter', 'VK', 'Telegram', 'Instagram', 'YouTube'];
        return platforms.map((platform) => {
            const items = posts.filter((p) => p.platform === platform);
            const positive = items.filter((p) => p.sentiment === 'positive').length;
            const neutral = items.filter((p) => p.sentiment === 'neutral').length;
            const negative = items.filter((p) => p.sentiment === 'negative').length;
            const total = positive + neutral + negative;
            return { platform, positive, neutral, negative, total };
        });
    }, [posts]);

    const maxBarTotal = useMemo(() => {
        const max = Math.max(...barData.map((d) => d.total), 1);
        return Math.max(max, 4);
    }, [barData]);

    const lineData = useMemo(() => {
        if (!posts.length) return [];

        const grouped = {};
        posts.forEach((post) => {
            const dateStr = post.createdAt
                ? new Date(post.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                })
                : 'День';

            if (!grouped[dateStr]) {
                grouped[dateStr] = { date: dateStr, views: 0, likes: 0 };
            }
            grouped[dateStr].views += Number(post.views) || 0;
            grouped[dateStr].likes += Number(post.likes) || 0;
        });

        return Object.values(grouped).slice(-6);
    }, [posts]);

    const maxMetric = useMemo(() => {
        let max = 100;
        lineData.forEach((d) => {
            if (d.views > max) max = d.views;
            if (d.likes > max) max = d.likes;
        });
        return max;
    }, [lineData]);

    const chartWidth = 360;
    const chartHeight = 150;
    const paddingX = 35;
    const paddingY = 25;

    const pointsViews = useMemo(() => {
        if (lineData.length < 2) return '';
        return lineData
            .map((d, i) => {
                const x = paddingX + (i / (lineData.length - 1)) * (chartWidth - paddingX * 2);
                const y = chartHeight - paddingY - (d.views / maxMetric) * (chartHeight - paddingY * 2);
                return `${x},${y}`;
            })
            .join(' ');
    }, [lineData, maxMetric]);

    const pointsLikes = useMemo(() => {
        if (lineData.length < 2) return '';
        return lineData
            .map((d, i) => {
                const x = paddingX + (i / (lineData.length - 1)) * (chartWidth - paddingX * 2);
                const y = chartHeight - paddingY - (d.likes / maxMetric) * (chartHeight - paddingY * 2);
                return `${x},${y}`;
            })
            .join(' ');
    }, [lineData, maxMetric]);

    return (
        <div className="charts-split-grid">
            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Тональность публикаций</h3>
                        <span className="chart-subtitle">Распределение по платформам</span>
                    </div>
                    <div className="chart-legend">
                        <span className="legend-tag tag-pos">● Позитив</span>
                        <span className="legend-tag tag-neu">● Нейтрал</span>
                        <span className="legend-tag tag-neg">● Негатив</span>
                    </div>
                </div>

                <div className="stacked-bars-container">
                    {barData.map((item) => {
                        const posH = (item.positive / maxBarTotal) * 100;
                        const neuH = (item.neutral / maxBarTotal) * 100;
                        const negH = (item.negative / maxBarTotal) * 100;

                        return (
                            <div key={item.platform} className="bar-column">
                                <div className="bar-track">
                                    <div
                                        className="bar-segment seg-neg"
                                        style={{ height: `${negH}%` }}
                                        title={`Негатив: ${item.negative}`}
                                    ></div>
                                    <div
                                        className="bar-segment seg-neu"
                                        style={{ height: `${neuH}%` }}
                                        title={`Нейтрал: ${item.neutral}`}
                                    ></div>
                                    <div
                                        className="bar-segment seg-pos"
                                        style={{ height: `${posH}%` }}
                                        title={`Позитив: ${item.positive}`}
                                    ></div>
                                </div>
                                <span className="bar-label">{item.platform.slice(0, 4)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Динамика метрик</h3>
                        <span className="chart-subtitle">Суммарный охват за период</span>
                    </div>
                    <div className="chart-legend">
                        <span className="legend-tag tag-views">● Просмотры</span>
                        <span className="legend-tag tag-likes">● Лайки</span>
                    </div>
                </div>

                <div className="svg-line-container">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart-svg">
                        <line
                            x1={paddingX}
                            y1={chartHeight - paddingY}
                            x2={chartWidth - paddingX}
                            y2={chartHeight - paddingY}
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                        />
                        <line
                            x1={paddingX}
                            y1={chartHeight / 2}
                            x2={chartWidth - paddingX}
                            y2={chartHeight / 2}
                            stroke="rgba(255,255,255,0.05)"
                            strokeDasharray="4 4"
                        />

                        {pointsViews && (
                            <polyline
                                fill="none"
                                stroke="#e0fd24"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pointsViews}
                            />
                        )}

                        {pointsLikes && (
                            <polyline
                                fill="none"
                                stroke="#fecfe5"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pointsLikes}
                            />
                        )}

                        {lineData.map((d, i) => {
                            const x =
                                lineData.length === 1
                                    ? chartWidth / 2
                                    : paddingX + (i / (lineData.length - 1)) * (chartWidth - paddingX * 2);
                            const yViews =
                                chartHeight - paddingY - (d.views / maxMetric) * (chartHeight - paddingY * 2);
                            const yLikes =
                                chartHeight - paddingY - (d.likes / maxMetric) * (chartHeight - paddingY * 2);

                            return (
                                <g key={i}>
                                    <circle cx={x} cy={yViews} r="4" fill="#e0fd24" stroke="#0c0e12" strokeWidth="2" />
                                    <circle cx={x} cy={yLikes} r="4" fill="#fecfe5" stroke="#0c0e12" strokeWidth="2" />
                                    <text
                                        x={x}
                                        y={chartHeight - 6}
                                        textAnchor="middle"
                                        fill="#64748b"
                                        fontSize="10"
                                        fontWeight="600"
                                    >
                                        {d.date}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsCharts;