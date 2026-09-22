const { Post } = require('../models');
const { Op } = require('sequelize');

// GET /posts — получение всех постов из базы данных PostgreSQL
exports.getAllPosts = async (req, res, next) => {
    try {
        const posts = await Post.findAll({
            order: [['id', 'ASC']] // Сортировка по возрастанию ID
        });
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

// QUERY /posts — поиск по ключевому слову в тексте (регистронезависимый поиск Op.iLike в Postgres)
exports.searchPostsByWord = async (req, res, next) => {
    try {
        const { search } = req.body;

        if (!search || typeof search !== 'string' || search.trim() === '') {
            return res.status(400).json({
                error: "Для выполнения QUERY-запроса передайте поле 'search' в JSON-теле"
            });
        }

        const searchWord = search.trim();
        const filteredPosts = await Post.findAll({
            where: {
                text: {
                    [Op.iLike]: `%${searchWord}%`
                }
            },
            order: [['id', 'ASC']]
        });

        res.status(200).json(filteredPosts);
    } catch (error) {
        next(error);
    }
};

// GET /posts/:id — получение одного поста по первичному ключу (ID)
exports.getPostById = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID поста должен быть числом" });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: `Пост с ID ${id} не найден` });
        }

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

// POST /posts — добавление нового поста в базу данных
exports.createPost = async (req, res, next) => {
    try {
        const { text, platform, sentiment = "neutral", likes = 0, views = 0 } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: "Поле 'text' обязательно и должно быть строкой" });
        }
        if (!platform || typeof platform !== 'string' || platform.trim() === '') {
            return res.status(400).json({ error: "Поле 'platform' обязательно и должно быть строкой" });
        }

        const newPost = await Post.create({
            text: text.trim(),
            platform: platform.trim(),
            sentiment: sentiment.toLowerCase(),
            likes: Number(likes) || 0,
            views: Number(views) || 0
        });

        res.status(201).json(newPost);
    } catch (error) {
        next(error);
    }
};

// PUT /posts/:id — полное обновление поста
exports.updatePost = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID поста должен быть числом" });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: `Пост с ID ${id} не найден` });
        }

        const { text, platform, sentiment, likes, views } = req.body;

        if (!text || !platform || !sentiment) {
            return res.status(400).json({
                error: "Для полного обновления (PUT) передайте: 'text', 'platform' и 'sentiment'"
            });
        }

        await post.update({
            text: text.trim(),
            platform: platform.trim(),
            sentiment: sentiment.toLowerCase(),
            likes: likes !== undefined ? Number(likes) : post.likes,
            views: views !== undefined ? Number(views) : post.views
        });

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

// PATCH /posts/:id — частичное обновление поста
exports.patchPost = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID поста должен быть числом" });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: `Пост с ID ${id} не найден` });
        }

        const { text, platform, sentiment, likes, views } = req.body;
        const updateData = {};

        if (text !== undefined) {
            if (typeof text !== 'string' || text.trim() === '') {
                return res.status(400).json({ error: "Поле 'text' должно быть непустой строкой" });
            }
            updateData.text = text.trim();
        }

        if (platform !== undefined) {
            if (typeof platform !== 'string' || platform.trim() === '') {
                return res.status(400).json({ error: "Поле 'platform' должно быть непустой строкой" });
            }
            updateData.platform = platform.trim();
        }

        if (sentiment !== undefined) {
            updateData.sentiment = String(sentiment).toLowerCase();
        }

        if (likes !== undefined) {
            updateData.likes = Number(likes) || 0;
        }

        if (views !== undefined) {
            updateData.views = Number(views) || 0;
        }

        await post.update(updateData);

        res.status(200).json(post);
    } catch (error) {
        next(error);
    }
};

// DELETE /posts/:id — удаление поста из базы данных
exports.deletePost = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            return res.status(400).json({ error: "ID поста должен быть числом" });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ error: `Пост с ID ${id} не найден` });
        }

        // Сохраняем объект перед удалением для вывода в ответе
        const deletedPostData = post.toJSON();
        await post.destroy();

        res.status(200).json({
            message: `Пост с ID ${id} успешно удален`,
            post: deletedPostData
        });
    } catch (error) {
        next(error);
    }
};