const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const jwt = require('jsonwebtoken');

// Optional auth middleware so AI knows if user is logged in
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = decoded;
    } catch (err) {}
  }
  next();
};

router.post('/chat', optionalAuth, ctrl.chat);
router.get('/suggestions', optionalAuth, ctrl.getSuggestions);

module.exports = router;
