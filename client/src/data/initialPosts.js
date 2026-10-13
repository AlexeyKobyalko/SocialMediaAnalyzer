/**
 * Начальные (моковые) посты — форма совместима с моделью Post на бэкенде
 * (text, platform, sentiment, likes, views) для лёгкого перехода к API в лабе 5.
 */
export const INITIAL_POSTS = [
  {
    id: 1,
    text: 'Запустили новый продукт — отзывы уже сыпятся!',
    platform: 'Twitter',
    sentiment: 'positive',
    likes: 128,
    views: 3400,
  },
  {
    id: 2,
    text: 'Сервис снова недоступен второй час. Когда почините?',
    platform: 'VK',
    sentiment: 'negative',
    likes: 45,
    views: 2100,
  },
  {
    id: 3,
    text: 'Обзор тарифов на Q3: сравниваем варианты без эмоций.',
    platform: 'Telegram',
    sentiment: 'neutral',
    likes: 67,
    views: 1500,
  },
];

export const PLATFORMS = ['Twitter', 'VK', 'Telegram', 'Instagram', 'YouTube'];
export const SENTIMENTS = ['positive', 'neutral', 'negative'];

export const STORAGE_KEY = 'sma_posts';
