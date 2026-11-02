require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/PostMongo');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_media_db');

        await Post.deleteMany({});

        await Post.create([
            {
                text: 'Новая версия фреймворка работает невероятно быстро и стабильно!',
                platform: 'Telegram',
                sentiment: 'positive',
                likes: 145,
                views: 2400,
                tags: ['фреймворк', 'релиз', 'скорость'],
                comments: [
                    { author: 'Иван', text: 'Полностью согласен, скорость выросла в разы!', sentiment: 'positive' },
                    { author: 'Мария', text: 'А есть инструкция по миграции?', sentiment: 'neutral' }
                ]
            },
            {
                text: 'Приложение постоянно зависает после обновления. Ужасный сервис.',
                platform: 'VK',
                sentiment: 'negative',
                likes: 42,
                views: 890,
                tags: ['баг', 'жалоба', 'обновление'],
                comments: [
                    { author: 'Служба поддержки', text: 'Здравствуйте! Напишите нам в ЛС ваш ID, поможем разобраться.', sentiment: 'neutral' }
                ]
            },
            {
                text: 'Завтра в 19:00 проведем прямой эфир с ответами на вопросы пользователей.',
                platform: 'Twitter',
                sentiment: 'neutral',
                likes: 29,
                views: 1100,
                tags: ['анонс', 'стрим', 'qna'],
                comments: []
            }
        ]);

        console.log('Тестовые данные успешно добавлены в MongoDB!');
        process.exit(0);
    } catch (error) {
        console.error('Ошибка заполнения базы:', error);
        process.exit(1);
    }
}

seed();