let posts = [
    {
        id: 1,
        text: "Новая версия фреймворка работает невероятно быстро и стабильно!",
        platform: "Telegram",
        sentiment: "positive",
        likes: 125,
        createdAt: new Date("2026-03-01T10:15:00Z")
    },
    {
        id: 2,
        text: "Приложение постоянно зависает после обновления. Ужасный сервис.",
        platform: "VK",
        sentiment: "negative",
        likes: 42,
        createdAt: new Date("2026-03-02T12:30:00Z")
    },
    {
        id: 3,
        text: "Завтра в 19:00 проведем прямой эфир с ответами на вопросы пользователей.",
        platform: "Twitter",
        sentiment: "neutral",
        likes: 18,
        createdAt: new Date("2026-03-03T08:00:00Z")
    }
];

let nextId = 4;

module.exports = {
    posts,
    getNextId: () => nextId++
};