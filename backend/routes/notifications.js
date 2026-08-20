const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');
const { protect }  = require('../middleware/auth');
const { success }  = require('../utils/apiResponse');

router.use(protect);

// Get user's notifications (latest 30)
router.get('/', async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    success(res, { notifications, unreadCount });
  } catch (e) { next(e); }
});

// Mark one as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true }
    );
    success(res, {}, 'Marked as read');
  } catch (e) { next(e); }
});

// Mark all as read
router.patch('/read-all', async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    success(res, {}, 'All notifications marked as read');
  } catch (e) { next(e); }
});

module.exports = router;
