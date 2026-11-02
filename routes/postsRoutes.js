const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

router.all('/', (req, res, next) => {
    if (req.method === 'QUERY') {
        return postsController.searchPostsByWord(req, res, next);
    }
    next();
});

router.get('/', postsController.getAllPosts);
router.get('/:id', postsController.getPostById);

router.post('/:id/comments', postsController.addComment);

router.post('/', postsController.createPost);
router.put('/:id', postsController.updatePost);
router.patch('/:id', postsController.patchPost);
router.delete('/:id', postsController.deletePost);

module.exports = router;