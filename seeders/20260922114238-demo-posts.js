'use strict';

module.exports = {
    async up (queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Posts', [
            {
                text: 'Новая версия фреймворка работает невероятно быстро и стабильно!',
                platform: 'Telegram',
                sentiment: 'positive',
                likes: 125,
                createdAt: new Date('2026-03-01T10:15:00Z'),
                updatedAt: new Date('2026-03-01T10:15:00Z')
            },
            {
                text: 'Приложение постоянно зависает после обновления. Ужасный сервис.',
                platform: 'VK',
                sentiment: 'negative',
                likes: 42,
                createdAt: new Date('2026-03-02T12:30:00Z'),
                updatedAt: new Date('2026-03-02T12:30:00Z')
            },
            {
                text: 'Завтра в 19:00 проведем прямой эфир с ответами на вопросы пользователей.',
                platform: 'Twitter',
                sentiment: 'neutral',
                likes: 18,
                createdAt: new Date('2026-03-03T08:00:00Z'),
                updatedAt: new Date('2026-03-03T08:00:00Z')
            }
        ], {});
    },

    async down (queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Posts', null, {});
    }
};