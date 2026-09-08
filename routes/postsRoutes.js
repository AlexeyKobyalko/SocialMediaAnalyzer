const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');

router.all('/', (req, res, next) => {
    if (req.method === 'QUERY') {
        return postsController.searchPostsByWord(req, res);
    }
    next();
});

router.get('/', postsController.getAllPosts);
router.post('/', postsController.createPost);
router.get('/:id', postsController.getPostById);
router.put('/:id', postsController.updatePost);
router.patch('/:id', postsController.patchPost);
router.delete('/:id', postsController.deletePost);

module.exports = router;