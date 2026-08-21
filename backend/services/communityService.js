const HireMePost   = require('../models/HireMePost');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { escapeRegExp } = require('../utils/string');

// ── Get all Hire-Me posts (filterable by category, search, city, etc.) ────────
const getAllPosts = async (query = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const skip  = (page - 1) * limit;

  const filter = { isActive: true, deletedAt: null };
  if (query.search) {
    const escaped = escapeRegExp(query.search);
    filter.$or = [
      { title: new RegExp(escaped, 'i') },
      { description: new RegExp(escaped, 'i') },
      { skills: new RegExp(escaped, 'i') },
    ];
  }
  if (query.roleCategory && query.roleCategory !== 'all') {
    filter.roleCategory = query.roleCategory;
  }
  if (query.city) {
    filter['location.city'] = new RegExp(escapeRegExp(query.city), 'i');
  }

  const [posts, total] = await Promise.all([
    HireMePost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('authorId', 'name avatar role headline bio skills location cvUrl followers'),
    HireMePost.countDocuments(filter),
  ]);

  return { posts, total, page, pages: Math.ceil(total / limit) };
};

// ── Get single post and increment view count ─────────────────────────────────
const getPostById = async (id) => {
  const post = await HireMePost.findOneAndUpdate(
    { _id: id, isActive: true, deletedAt: null },
    { $inc: { views: 1 } },
    { new: true }
  ).populate('authorId', 'name email avatar role headline bio skills languages location cvUrl followers');

  if (!post) {
    const err = new Error('Post not found or has been removed');
    err.statusCode = 404;
    throw err;
  }
  return post;
};

// ── Create a new Hire-Me post ────────────────────────────────────────────────
const createPost = async (authorId, data) => {
  const user = await User.findById(authorId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const post = await HireMePost.create({
    authorId,
    title:        data.title,
    roleCategory: data.roleCategory || 'software_dev',
    skills:       Array.isArray(data.skills) ? data.skills : (data.skills || '').split(',').map(s => s.trim()).filter(Boolean),
    description:  data.description,
    rate:         data.rate || {},
    availability: data.availability || 'immediate',
    location:     data.location || { city: 'Tunis', country: 'Tunisia', isRemote: true },
    portfolioLinks: data.portfolioLinks || [],
    contactInfo:  data.contactInfo || {
      email: user.email,
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
    },
  });

  // Notify user's followers about this new hire-me post
  if (user.followers && user.followers.length > 0) {
    const notifications = user.followers.map(followerId => ({
      userId:  followerId,
      title:   `🌟 New Post from ${user.name}`,
      message: `${user.name} published a new Hire-Me availability: "${post.title}"`,
      type:    'hire_me_post',
      link:    '/dashboard',
    }));
    try {
      await Notification.insertMany(notifications);
    } catch (_) { /* non-fatal */ }
  }

  return post.populate('authorId', 'name avatar role headline bio skills');
};

// ── Get author's own posts with full inquiries / contact leads ───────────────
const getMyPostsWithInquiries = async (authorId) => {
  const posts = await HireMePost.find({ authorId, deletedAt: null })
    .sort({ createdAt: -1 })
    .populate('inquiries.senderId', 'name email avatar role company');

  const totalInquiries = posts.reduce((acc, p) => acc + (p.inquiries?.length || 0), 0);
  const totalViews = posts.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

  return {
    posts,
    stats: {
      totalPosts: posts.length,
      totalInquiries,
      totalViews,
      totalLikes,
    },
  };
};

// ── Send an inquiry / Contact request to a Hire-Me author ────────────────────
const sendInquiry = async (postId, senderId, inquiryData, io) => {
  const post = await HireMePost.findOne({ _id: postId, isActive: true, deletedAt: null });
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  const sender = await User.findById(senderId);
  if (!sender) {
    const err = new Error('Sender user not found');
    err.statusCode = 404;
    throw err;
  }

  const newInquiry = {
    senderId,
    senderName:    inquiryData.name || sender.name,
    senderEmail:   inquiryData.email || sender.email,
    senderPhone:   inquiryData.phone || '',
    senderCompany: inquiryData.company || sender.company?.name || '',
    message:       inquiryData.message,
    offeredBudget: inquiryData.offeredBudget || '',
    createdAt:     new Date(),
  };

  post.inquiries.push(newInquiry);
  await post.save();

  // Create notification for the post author
  const authorIdStr = post.authorId.toString();
  await Notification.create({
    userId:  post.authorId,
    title:   '💼 New Job / Hire Offer Received!',
    message: `${newInquiry.senderName} is interested in working with you for "${post.title}".`,
    type:    'hire_me_inquiry',
    link:    '/dashboard',
  });

  // Real-time socket notification
  if (io) {
    io.to(authorIdStr).emit('hire_me:inquiry_new', {
      postId: post._id,
      postTitle: post.title,
      senderName: newInquiry.senderName,
      message: newInquiry.message,
      createdAt: newInquiry.createdAt,
    });
  }

  return { success: true, inquiry: newInquiry };
};

// ── Toggle Like on a Hire-Me post ────────────────────────────────────────────
const toggleLikePost = async (postId, userId) => {
  const post = await HireMePost.findById(postId);
  if (!post) {
    const err = new Error('Post not found');
    err.statusCode = 404;
    throw err;
  }

  const index = post.likes.indexOf(userId);
  const isLiked = index !== -1;

  if (isLiked) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(userId);
  }

  await post.save();
  return { isLiked: !isLiked, likesCount: post.likes.length };
};

// ── Delete / Archive a Hire-Me post ──────────────────────────────────────────
const deletePost = async (postId, authorId) => {
  const post = await HireMePost.findOne({ _id: postId, authorId });
  if (!post) {
    const err = new Error('Post not found or unauthorized');
    err.statusCode = 404;
    throw err;
  }
  post.deletedAt = new Date();
  post.isActive = false;
  await post.save();
  return { success: true };
};

// ── Follow System: Follow / Unfollow a User ──────────────────────────────────
const toggleFollowUser = async (currentUserId, targetUserId, io) => {
  if (currentUserId.toString() === targetUserId.toString()) {
    const err = new Error('You cannot follow yourself');
    err.statusCode = 400;
    throw err;
  }

  const [currentUser, targetUser] = await Promise.all([
    User.findById(currentUserId),
    User.findById(targetUserId),
  ]);

  if (!currentUser || !targetUser) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const isFollowing = currentUser.following.some(id => id.toString() === targetUserId.toString());

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId.toString());
    targetUser.followers  = targetUser.followers.filter(id => id.toString() !== currentUserId.toString());
    await Promise.all([currentUser.save(), targetUser.save()]);

    return {
      isFollowing: false,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    };
  } else {
    // Follow
    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);
    await Promise.all([currentUser.save(), targetUser.save()]);

    // Send notification to target user
    await Notification.create({
      userId:  targetUser._id,
      title:   '👥 New Follower!',
      message: `${currentUser.name} started following your profile and job updates.`,
      type:    'social_follow',
      link:    `/users/${currentUser._id}`,
    });

    if (io) {
      io.to(targetUser._id.toString()).emit('social:new_follower', {
        followerId: currentUser._id,
        followerName: currentUser.name,
        followerAvatar: currentUser.avatar,
      });
    }

    return {
      isFollowing: true,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length,
    };
  }
};

// ── Get followers and following list for a user ──────────────────────────────
const getFollowData = async (userId) => {
  const user = await User.findById(userId)
    .populate('followers', 'name email avatar role headline bio skills')
    .populate('following', 'name email avatar role headline bio skills');

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return {
    followers: user.followers || [],
    following: user.following || [],
    followersCount: user.followers?.length || 0,
    followingCount: user.following?.length || 0,
  };
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  getMyPostsWithInquiries,
  sendInquiry,
  toggleLikePost,
  deletePost,
  toggleFollowUser,
  getFollowData,
};
