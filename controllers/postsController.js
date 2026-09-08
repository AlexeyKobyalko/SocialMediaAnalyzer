const { posts, getNextId } = require('../data/postsData');

exports.getAllPosts = (req, res) => {
    res.status(200).json(posts);
};

exports.searchPostsByWord = (req, res) => {
    const { search } = req.body;

    if (!search || typeof search !== 'string' || search.trim() === '') {
        return res.status(400).json({
            error: "Для выполнения QUERY-запроса передайте поле 'search' в JSON-теле"
        });
    }

    const searchWord = search.trim().toLowerCase();
    const filteredPosts = posts.filter(post =>
        post.text.toLowerCase().includes(searchWord)
    );

    res.status(200).json(filteredPosts);
};

exports.getPostById = (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "ID поста должен быть числом" });
    }

    const post = posts.find(p => p.id === id);

    if (!post) {
        return res.status(404).json({ error: `Пост с ID ${id} не найден` });
    }

    res.status(200).json(post);
};

exports.createPost = (req, res) => {
    const { text, platform, sentiment = "neutral", likes = 0 } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({ error: "Поле 'text' обязательно и должно быть строкой" });
    }
    if (!platform || typeof platform !== 'string' || platform.trim() === '') {
        return res.status(400).json({ error: "Поле 'platform' обязательно и должно быть строкой" });
    }

    const newPost = {
        id: getNextId(),
        text: text.trim(),
        platform: platform.trim(),
        sentiment: sentiment.toLowerCase(),
        likes: Number(likes) || 0,
        createdAt: new Date()
    };

    posts.push(newPost);
    res.status(201).json(newPost);
};

exports.updatePost = (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "ID поста должен быть числом" });
    }

    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
        return res.status(404).json({ error: `Пост с ID ${id} не найден` });
    }

    const { text, platform, sentiment, likes } = req.body;

    if (!text || !platform || !sentiment) {
        return res.status(400).json({
            error: "Для полного обновления (PUT) передайте: 'text', 'platform' и 'sentiment'"
        });
    }

    posts[postIndex] = {
        id: id,
        text: text.trim(),
        platform: platform.trim(),
        sentiment: sentiment.toLowerCase(),
        likes: likes !== undefined ? Number(likes) : posts[postIndex].likes,
        createdAt: posts[postIndex].createdAt,
        updatedAt: new Date()
    };

    res.status(200).json(posts[postIndex]);
};

exports.patchPost = (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "ID поста должен быть числом" });
    }

    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
        return res.status(404).json({ error: `Пост с ID ${id} не найден` });
    }

    const { text, platform, sentiment, likes } = req.body;

    if (text !== undefined) {
        if (typeof text !== 'string' || text.trim() === '') {
            return res.status(400).json({ error: "Поле 'text' должно быть непустой строкой" });
        }
        posts[postIndex].text = text.trim();
    }

    if (platform !== undefined) {
        if (typeof platform !== 'string' || platform.trim() === '') {
            return res.status(400).json({ error: "Поле 'platform' должно быть непустой строкой" });
        }
        posts[postIndex].platform = platform.trim();
    }

    if (sentiment !== undefined) {
        posts[postIndex].sentiment = String(sentiment).toLowerCase();
    }

    if (likes !== undefined) {
        posts[postIndex].likes = Number(likes) || 0;
    }

    posts[postIndex].updatedAt = new Date();

    res.status(200).json(posts[postIndex]);
};

exports.deletePost = (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        return res.status(400).json({ error: "ID поста должен быть числом" });
    }

    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
        return res.status(404).json({ error: `Пост с ID ${id} не найден` });
    }

    const [deletedPost] = posts.splice(postIndex, 1);

    res.status(200).json({
        message: `Пост с ID ${id} успешно удален`,
        post: deletedPost
    });
};