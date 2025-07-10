const {
  Tag,
  Category,
  Post,
  Comment,
  Report,
  Notification
} = require('../models/community');
const User = require('../models/User');

// Tag Controllers
exports.createTag = async (req, res) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();
    res.status(201).json(tag);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Category Controllers
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Post Controllers
// exports.createPost = async (req, res) => {
//   try {
//     console.log("hit")
//     const post = new Post({
//       ...req.body,
//       author: req.user._id
//     });

//     console.log(post)
//     await post.save();
    
//     await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
    
//     res.status(201).json(post);
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// };

exports.createPost = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized user' });
    }
    console.log("hit")

    const { title, content, category, tags } = req.body;

    const post = new Post({
      title,
      content,
      category,
      tags,
      author: req.user._id
    });

    await post.save();

    await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });

    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(400).json({ error: error.message });
  }
};


exports.getPost = async (req, res) => {
  try {
    console.log("hit")
    //  const posttoset = await Post.findById(req.params.id);

    // // Increment view count
    // posttoset.viewCount += 1;

    // await posttoset.save();
    const post = await Post.findById(req.params.id)
      .populate('author', 'name username avatar')
      .populate('category')
      .populate('tags')
      .populate({
    path: 'comments',
    populate: {
      path: 'author',
      select: 'name avatar'
    }
  });
      console.log(post)
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
   
    console.log("itna to chak gya")
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPostsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { sort = 'latest', page = 1, limit = 10 } = req.query;
    
    const sortOptions = {
      latest: { createdAt: -1 },
      popular: { viewCount: -1 },
      'most-comments': { 'comments.length': -1 }
    };
    
    const posts = await Post.find({ category: categoryId })
      .sort(sortOptions[sort] || sortOptions.latest)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('author', 'username name avatar')
      .populate('category')
      .populate('tags')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });
  
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query, category, tags } = req.query;
    const searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (category) {
      searchQuery.category = category;
    }
    
    if (tags) {
      searchQuery.tags = { $in: tags.split(',') };
    }
    
    const posts = await Post.find(searchQuery)
      .populate('author', 'username avatar')
      .populate('category')
      .populate('tags');
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Comment Controllers
exports.addComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    
    const comment = new Comment({
      content,
      author: req.user._id,
      postId,
      parentCommentId: parentCommentId || null
    });
    
    await comment.save();
    
    // Add comment to post
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });
    
    // Update user's last active time
    await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
    
    // Create notification if it's a reply to another comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).populate('author');
      if (parentComment.author._id.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          recipient: parentComment.author._id,
          sender: req.user._id,
          type: 'reply',
          relatedItemType: 'comment',
          relatedItemId: comment._id
        });
        await notification.save();
      }
    }
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCommentsForPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { nested = 'true' } = req.query;
    
    if (nested === 'true') {
      // Get comments with nested replies
      const comments = await Comment.find({ postId, parentCommentId: null })
        .populate('author', 'username avatar')
        .populate({
          path: 'replies',
          populate: {
            path: 'author',
            select: 'username avatar'
          }
        });
      
      res.json(comments);
    } else {
      // Get all comments flat
      const comments = await Comment.find({ postId })
        .populate('author', 'username avatar');
      
      res.json(comments);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reaction Controllers
exports.addReaction = async (req, res) => {
  try {
    const { itemType, itemId, reactionType } = req.body;
    console.log(req.body)
    // Check if user already reacted
    const existingReaction = await this.getReactionModel(itemType).findOne({
      _id: itemId,
      'reactions.userId': req.user._id
    });
    
    if (existingReaction) {
      return res.status(400).json({ error: 'You have already reacted to this item' });
    }
    
    const reaction = {
      userId: req.user._id,
      type: reactionType || 'like'
    };
    
    await this.getReactionModel(itemType).findByIdAndUpdate(
      itemId,
      { $push: { reactions: reaction } }
    );
    
    // Create notification
    const item = await this.getReactionModel(itemType).findById(itemId).populate('author');
    if (item.author._id.toString() !== req.user._id.toString()) {
      const notification = new Notification({
        recipient: item.author._id,
        sender: req.user._id,
        type: 'reaction',
        relatedItemType: itemType,
        relatedItemId: itemId
      });
      await notification.save();
    }
    
    // Update user's last active time
    await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
    
    res.status(201).json({ message: 'Reaction added successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getReactionModel = (itemType) => {
  switch (itemType) {
    case 'post':
      return Post;
    case 'comment':
      return Comment;
    default:
      throw new Error('Invalid item type for reaction');
  }
};

// Report Controllers
exports.createReport = async (req, res) => {
  try {
    const { reportedItemType, reportedItemId, reason } = req.body;
    
    const report = new Report({
      reporter: req.user._id,
      reportedItemType,
      reportedItemId,
      reason
    });
    
    await report.save();
    
    // Notify moderators
    const moderators = await User.find({ isModerator: true });
    await Promise.all(moderators.map(moderator => {
      const notification = new Notification({
        recipient: moderator._id,
        sender: req.user._id,
        type: 'moderation',
        relatedItemType: reportedItemType,
        relatedItemId: reportedItemId
      });
      return notification.save();
    }));
    
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Notification Controllers
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('sender', 'username avatar');
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Moderation Controllers
exports.getReportedItems = async (req, res) => {
  try {
    if (!req.user.isModerator) {
      return res.status(403).json({ error: 'Only moderators can access this endpoint' });
    }
    
    const reports = await Report.find({ status: 'pending' })
      .populate('reporter', 'username')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    if (!req.user.isModerator) {
      return res.status(403).json({ error: 'Only moderators can access this endpoint' });
    }
    
    const { reportId, action } = req.params;
    const report = await Report.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update report status
    report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
    report.resolvedAt = new Date();
    report.resolvedBy = req.user._id;
    await report.save();
    
    // Take additional action if needed
    if (action === 'remove') {
      await this.getReactionModel(report.reportedItemType).findByIdAndDelete(report.reportedItemId);
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};