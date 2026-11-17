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

router.post('/', authMiddleware, isAdmin, postsController.createPost);
router.put('/:id', authMiddleware, isAdmin, postsController.updatePost);
router.patch('/:id', authMiddleware, isAdmin, postsController.patchPost);
router.delete('/:id', authMiddleware, isAdmin, postsController.deletePost);

router.post('/:id/comments', authMiddleware, isAdmin, postsController.addComment);
router.put('/:id/comments/:commentId', authMiddleware, isAdmin, postsController.updateComment);
router.patch('/:id/comments/:commentId/likes', authMiddleware, isAdmin, postsController.updateCommentLikes);
router.delete('/:id/comments/:commentId', authMiddleware, isAdmin, postsController.deleteComment);

module.exports = router;
