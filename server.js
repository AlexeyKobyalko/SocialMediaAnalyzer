require('dotenv').config();
const express = require('express');
const postsRoutes = require('./routes/postsRoutes');
const authRoutes = require('./routes/authRoutes');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/auth', authRoutes);
app.use('/posts', postsRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Запрашиваемый маршрут не существует" });
});

app.use((err, req, res, next) => {
    console.error('Непредвиденная ошибка:', err.stack);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, async () => {
    console.log(`===========================================`);
    console.log(`Сервер запущен на http://localhost:${PORT}`);

    try {
        await sequelize.authenticate();
        console.log(' Подключение к PostgreSQL успешно установлено!');
    } catch (error) {
        console.error(' Ошибка подключения к базе данных:', error.message);
    }

    console.log(`===========================================`);
});