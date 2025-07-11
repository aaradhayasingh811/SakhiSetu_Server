const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const {protect} = require('../middleware/authMiddleware');
const { Tag, Category } = require('../models/community');
router.use(protect);

// Tag routes
router.post('/tags', communityController.createTag);
router.get('/tags', communityController.getAllTags);

// Category routes
router.post('/categories', communityController.createCategory);
router.get('/categories', communityController.getAllCategories);

// Post routes
router.post('/posts', communityController.createPost);
router.get('/posts/:id', communityController.getPost);
router.get('/categories/:categoryId/posts', communityController.getPostsByCategory);
router.get('/search/posts', communityController.searchPosts);

// Comment routes
router.post('/comments', communityController.addComment);
router.get('/posts/:postId/comments', communityController.getCommentsForPost);

// Reaction routes
router.post('/reactions', communityController.addReaction);

// Report routes
router.post('/reports', communityController.createReport);

// Notification routes
router.get('/notifications', communityController.getUserNotifications);
router.patch('/notifications/:notificationId/read', communityController.markNotificationAsRead);

// Moderation routes
router.get('/moderation/reports', communityController.getReportedItems);
router.patch('/moderation/reports/:reportId/:action', communityController.resolveReport);

router.post('/tags/resolve', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Tag name is required' });

  let tag = await Tag.findOne({ name });
  if (!tag) {
    tag = new Tag({ name });
    await tag.save();
  }
  res.json(tag);
});
module.exports = router;