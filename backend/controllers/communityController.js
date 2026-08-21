const communityService = require('../services/communityService');
const { success, created, badRequest } = require('../utils/apiResponse');

// ── GET /api/community/posts (All public hire-me / talent posts) ─────────────
const getPosts = async (req, res, next) => {
  try {
    const data = await communityService.getAllPosts(req.query);
    success(res, data);
  } catch (e) { next(e); }
};

// ── GET /api/community/posts/:id ─────────────────────────────────────────────
const getPost = async (req, res, next) => {
  try {
    const post = await communityService.getPostById(req.params.id);
    success(res, { post });
  } catch (e) { next(e); }
};

// ── POST /api/community/posts (Create hire-me post) ──────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return badRequest(res, 'Title and description are required for your Hire-Me post');
    }
    const post = await communityService.createPost(req.user.id, req.body);
    created(res, { post }, 'Your Hire-Me availability has been published!');
  } catch (e) { next(e); }
};

// ── GET /api/community/my-posts (Author's dashboard with leads & interactions) 
const getMyPosts = async (req, res, next) => {
  try {
    const data = await communityService.getMyPostsWithInquiries(req.user.id);
    success(res, data);
  } catch (e) { next(e); }
};

// ── POST /api/community/posts/:id/inquiry (Contact author / send hire offer) ──
const sendInquiry = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return badRequest(res, 'A message or project brief is required');
    const io = req.app.get('io');
    const result = await communityService.sendInquiry(req.params.id, req.user.id, req.body, io);
    created(res, result, 'Inquiry sent! The talent has been notified.');
  } catch (e) { next(e); }
};

// ── POST /api/community/posts/:id/like ───────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const result = await communityService.toggleLikePost(req.params.id, req.user.id);
    success(res, result);
  } catch (e) { next(e); }
};

// ── DELETE /api/community/posts/:id ─────────────────────────────────────────
const deletePost = async (req, res, next) => {
  try {
    await communityService.deletePost(req.params.id, req.user.id);
    success(res, {}, 'Post deleted');
  } catch (e) { next(e); }
};

// ── POST /api/community/follow/:userId ───────────────────────────────────────
const toggleFollow = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const result = await communityService.toggleFollowUser(req.user.id, req.params.userId, io);
    success(res, result, result.isFollowing ? 'Following user' : 'Unfollowed user');
  } catch (e) { next(e); }
};

// ── GET /api/community/follow-data (Current user's followers & following) ────
const getMyFollowData = async (req, res, next) => {
  try {
    const data = await communityService.getFollowData(req.user.id);
    success(res, data);
  } catch (e) { next(e); }
};

// ── GET /api/community/users/:userId/follow-data ─────────────────────────────
const getUserFollowData = async (req, res, next) => {
  try {
    const data = await communityService.getFollowData(req.params.userId);
    success(res, data);
  } catch (e) { next(e); }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  getMyPosts,
  sendInquiry,
  toggleLike,
  deletePost,
  toggleFollow,
  getMyFollowData,
  getUserFollowData,
};
