const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/communityController');
const { protect } = require('../middleware/auth');

// Public read routes
router.get('/posts',         ctrl.getPosts);
router.get('/posts/:id',     ctrl.getPost);
router.get('/users/:userId/follow-data', ctrl.getUserFollowData);

// Protected routes (Student, Citizen, Admin)
router.use(protect);

router.post('/posts',            ctrl.createPost);
router.get('/my-posts',          ctrl.getMyPosts);
router.delete('/posts/:id',      ctrl.deletePost);
router.post('/posts/:id/like',   ctrl.toggleLike);
router.post('/posts/:id/inquiry',ctrl.sendInquiry);

// Follow / Unfollow & Follow lists
router.post('/follow/:userId',   ctrl.toggleFollow);
router.get('/follow-data',       ctrl.getMyFollowData);

module.exports = router;
