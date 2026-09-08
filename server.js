const express = require('express');
const postsRoutes = require('./routes/postsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use('/posts', postsRoutes);

app.use((req, res) => {
    res.status(404).json({ error: "Запрашиваемый маршрут не существует" });
});

app.use((err, req, res, next) => {
    console.error('Непредвиденная ошибка:', err.stack);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Архитектура: Routes + Controllers + In-Memory Data`);
    console.log(`===========================================`);
});