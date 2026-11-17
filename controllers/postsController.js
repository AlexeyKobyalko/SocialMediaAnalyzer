const Post = require('../models/PostMongo');

const VALID_SENTIMENTS = ['positive', 'neutral', 'negative'];

function normalizeSentiment(value, fallback = 'neutral') {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    return VALID_SENTIMENTS.includes(normalized) ? normalized : fallback;
}

function normalizeTags(tags) {
    const raw = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
            ? tags.split(',')
            : [];
    const seen = new Set();
    const result = [];
    for (const item of raw) {
        if (typeof item !== 'string') continue;
        const cleaned = item.trim().replace(/^#+/, '');
        if (cleaned && !seen.has(cleaned)) {
            seen.add(cleaned);
            result.push(cleaned);
        }
    }
    return result;
}

function handleMongooseError(error, res, next) {
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Некорректный формат ID' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
    }
    return next(error);
}

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
        handleMongooseError(error, res, next);
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
            sentiment: normalizeSentiment(sentiment),
            likes: Math.max(0, Number(likes) || 0),
            views: Math.max(0, Number(views) || 0),
            tags: normalizeTags(tags)
        });

        res.status(201).json(newPost);
    } catch (error) {
        handleMongooseError(error, res, next);
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
                sentiment: normalizeSentiment(sentiment),
                likes: Math.max(0, Number(likes) || 0),
                views: Math.max(0, Number(views) || 0),
                tags: normalizeTags(tags)
            },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: `Пост с ID ${req.params.id} не найден` });
        }

        res.status(200).json(updatedPost);
    } catch (error) {
        handleMongooseError(error, res, next);
    }
};

exports.patchPost = async (req, res, next) => {
    try {
        const { text, platform, sentiment, likes, views, tags } = req.body;
        const updateData = {};

        if (text !== undefined) updateData.text = String(text).trim();
        if (platform !== undefined) updateData.platform = String(platform).trim();
        if (sentiment !== undefined) updateData.sentiment = normalizeSentiment(String(sentiment));
        if (likes !== undefined) updateData.likes = Math.max(0, Number(likes) || 0);
        if (views !== undefined) updateData.views = Math.max(0, Number(views) || 0);
        if (tags !== undefined) updateData.tags = normalizeTags(tags);

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
        handleMongooseError(error, res, next);
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
        handleMongooseError(error, res, next);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const { text, author, sentiment, likes = 0 } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: "Поле 'text' для комментария обязательно" });
        }

        const newComment = {
            text: text.trim(),
            author: author && typeof author === 'string' && author.trim() ? author.trim() : 'Аноним',
            sentiment: normalizeSentiment(sentiment),
            likes: Math.max(0, Number(likes) || 0)
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
        handleMongooseError(error, res, next);
    }
};

exports.updateComment = async (req, res, next) => {
    try {
        const { text, author, sentiment, likes } = req.body;

        if (!text || typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: "Поле 'text' для комментария обязательно" });
        }

        const updateFields = {
            'comments.$.text': text.trim(),
            'comments.$.sentiment': normalizeSentiment(sentiment)
        };

        if (author !== undefined) {
            updateFields['comments.$.author'] =
                typeof author === 'string' && author.trim() ? author.trim() : 'Аноним';
        }
        if (likes !== undefined) {
            updateFields['comments.$.likes'] = Math.max(0, Number(likes) || 0);
        }

        const updatedPost = await Post.findOneAndUpdate(
            { _id: req.params.id, 'comments._id': req.params.commentId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Пост или комментарий не найден' });
        }

        res.status(200).json({
            message: 'Комментарий во вложенном массиве обновлен',
            post: updatedPost
        });
    } catch (error) {
        handleMongooseError(error, res, next);
    }
};

exports.updateCommentLikes = async (req, res, next) => {
    try {
        const { likes, delta } = req.body || {};
        let updateOperation;

        if (likes !== undefined) {
            updateOperation = {
                $set: { 'comments.$.likes': Math.max(0, Number(likes) || 0) }
            };
        } else {
            const step = Number(delta);
            updateOperation = {
                $inc: { 'comments.$.likes': Number.isFinite(step) && step !== 0 ? step : 1 }
            };
        }

        const updatedPost = await Post.findOneAndUpdate(
            { _id: req.params.id, 'comments._id': req.params.commentId },
            updateOperation,
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Пост или комментарий не найден' });
        }

        res.status(200).json({
            message: 'Количество лайков комментария обновлено',
            post: updatedPost
        });
    } catch (error) {
        handleMongooseError(error, res, next);
    }
};

exports.deleteComment = async (req, res, next) => {
    try {
        const updatedPost = await Post.findOneAndUpdate(
            { _id: req.params.id, 'comments._id': req.params.commentId },
            { $pull: { comments: { _id: req.params.commentId } } },
            { new: true }
        );

        if (!updatedPost) {
            return res.status(404).json({ error: 'Пост или комментарий не найден' });
        }

        res.status(200).json({
            message: 'Комментарий удален из вложенного массива',
            post: updatedPost
        });
    } catch (error) {
        handleMongooseError(error, res, next);
    }
};
