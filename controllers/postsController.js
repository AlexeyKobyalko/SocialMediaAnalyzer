const { Post } = require('../models');
const { Op } = require('sequelize');

exports.getAllPosts = async (req, res, next) => {
    try {
        const { search } = req.query;
        const whereClause = {};

        if (search && typeof search === 'string' && search.trim() !== '') {
            whereClause.text = {
                [Op.iLike]: `%${search.trim()}%`
            };
        }

        const posts = await Post.findAll({
            where: whereClause,
            order: [['id', 'ASC']]
        });
        res.status(200).json(posts);
    } catch (error) {
        next(error);
    }
};

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