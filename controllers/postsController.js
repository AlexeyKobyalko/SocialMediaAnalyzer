const Post = require('../models/PostMongo');

exports.getAllPosts = async (req, res, next) => {
    try {
        const { search } = req.query;
        const filter = {};

        if (search && typeof search === 'string' && search.trim() !== '') {
            filter.text = { $regex: search.trim(), $options: 'i' };
        }

        const posts = await Post.find(filter).sort({ createdAt: -1 });
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

        const filteredPosts = await Post.find({
            text: { $regex: search.trim(), $options: 'i' }
        }).sort({ createdAt: -1 });

        res.status(200).json(filteredPosts);
    } catch (error) {
        next(error);
    }
};

exports.getPostById = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(200).json(post);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Некорректный формат ID' });
        }
        next(error);
    }
};

exports.createPost = async (req, res, next) => {
    try {
        const { text, platform, sentiment = 'neutral', likes = 0, views = 0, tags = [] } = req.body;

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
            views: Number(views) || 0,
            tags: Array.isArray(tags) ? tags : []
        });

        res.status(201).json(newPost);
    } catch (error) {
        next(error);
    }
};

exports.updatePost = async (req, res, next) => {
    try {
        const { text, platform, sentiment, likes, views, tags } = req.body;

        if (!text || !platform || !sentiment) {
            return res.status(400).json({
                error: "Для полного обновления (PUT) передайте: 'text', 'platform' и 'sentiment'"
            });
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            {
                text: text.trim(),
                platform: platform.trim(),
                sentiment: sentiment.toLowerCase(),
                likes: Number(likes) || 0,
                views: Number(views) || 0,
                tags: Array.isArray(tags) ? tags : []
            },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Некорректный формат ID' });
        }
        next(error);
    }
};

exports.patchPost = async (req, res, next) => {
    try {
        const { text, platform, sentiment, likes, views, tags } = req.body;
        const updateData = {};

        if (text !== undefined) updateData.text = text.trim();
        if (platform !== undefined) updateData.platform = platform.trim();
        if (sentiment !== undefined) updateData.sentiment = String(sentiment).toLowerCase();
        if (likes !== undefined) updateData.likes = Number(likes) || 0;
        if (views !== undefined) updateData.views = Number(views) || 0;
        if (tags !== undefined && Array.isArray(tags)) updateData.tags = tags;

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Некорректный формат ID' });
        }
        next(error);
    }
};

exports.deletePost = async (req, res, next) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(200).json({
            message: `Пост с ID ${req.params.id} успешно удален`,
            post: deletedPost
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Некорректный формат ID' });
        }
        next(error);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const { text, author, sentiment } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: "Поле 'text' для комментария обязательно" });
        }

        const newComment = {
            text: text.trim(),
            author: author ? author.trim() : 'Аноним',
            sentiment: sentiment || 'neutral'
        };

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: newComment } },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(201).json({
            message: 'Комментарий успешно добавлен во вложенную структуру',
            post: updatedPost
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Некорректный формат ID' });
        }
        next(error);
    }
};