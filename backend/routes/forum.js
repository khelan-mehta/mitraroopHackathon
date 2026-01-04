import express from 'express';
import { Forum, Thread } from '../models/Forum.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get all forums
router.get('/', async (req, res) => {
  try {
    const forums = await Forum.find()
      .populate('members', 'name')
      .lean();

    // Get thread counts for each forum
    const forumsWithCounts = await Promise.all(
      forums.map(async (forum) => {
        const threadCount = await Thread.countDocuments({ forum: forum._id });
        return {
          ...forum,
          threads: threadCount,
          members: forum.members.length
        };
      })
    );

    res.json({
      success: true,
      data: { forums: forumsWithCounts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forums',
      error: error.message
    });
  }
});

// Get single forum
router.get('/:forumId', async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.forumId)
      .populate('members', 'name');

    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    const threadCount = await Thread.countDocuments({ forum: forum._id });

    res.json({
      success: true,
      data: {
        forum: {
          ...forum.toObject(),
          threads: threadCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forum',
      error: error.message
    });
  }
});

// Get threads for a forum
router.get('/:forumId/threads', async (req, res) => {
  try {
    const { sortBy = 'recent', search } = req.query;
    
    const query = { forum: req.params.forumId };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = {};
    if (sortBy === 'recent') {
      sortOptions = { lastActivity: -1 };
    } else if (sortBy === 'popular') {
      sortOptions = { views: -1 };
    } else if (sortBy === 'unanswered') {
      sortOptions = { 'replies.0': 1, createdAt: -1 };
    }

    const threads = await Thread.find(query)
      .populate('author', 'name email')
      .sort(sortOptions)
      .lean();

    const threadsWithStats = threads.map(thread => ({
      id: thread._id,
      title: thread.title,
      author: thread.author?.name || 'Unknown',
      replies: thread.replies.length,
      views: thread.views,
      lastActivity: thread.lastActivity,
      isPinned: thread.isPinned,
      tags: thread.tags
    }));

    res.json({
      success: true,
      data: { threads: threadsWithStats }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch threads',
      error: error.message
    });
  }
});

// Create a new thread
router.post('/:forumId/threads', protect, async (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const forum = await Forum.findById(req.params.forumId);
    if (!forum) {
      return res.status(404).json({
        success: false,
        message: 'Forum not found'
      });
    }

    const thread = await Thread.create({
      title,
      content,
      author: req.user._id,
      forum: req.params.forumId,
      tags: tags || []
    });

    // Add user to forum members if not already a member
    if (!forum.members.includes(req.user._id)) {
      forum.members.push(req.user._id);
      await forum.save();
    }

    const populatedThread = await Thread.findById(thread._id)
      .populate('author', 'name email');

    res.status(201).json({
      success: true,
      data: { thread: populatedThread }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create thread',
      error: error.message
    });
  }
});

// Get single thread
router.get('/thread/:threadId', async (req, res) => {
  try {
    const thread = await Thread.findByIdAndUpdate(
      req.params.threadId,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'name email')
      .populate('replies.author', 'name email')
      .populate('likes', 'name')
      .lean();

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    // Format the response
    const formattedThread = {
      id: thread._id,
      title: thread.title,
      content: thread.content,
      author: {
        name: thread.author?.name || 'Unknown',
        avatar: null,
        reputation: 0 // You can add reputation logic later
      },
      createdAt: thread.createdAt,
      views: thread.views,
      likes: thread.likes.length,
      tags: thread.tags,
      replies: thread.replies.map(reply => ({
        id: reply._id,
        content: reply.content,
        author: {
          name: reply.author?.name || 'Unknown',
          avatar: null,
          reputation: 0
        },
        createdAt: reply.createdAt,
        likes: reply.likes.length
      }))
    };

    res.json({
      success: true,
      data: { thread: formattedThread }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch thread',
      error: error.message
    });
  }
});

// Add reply to thread
router.post('/thread/:threadId/reply', protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const thread = await Thread.findByIdAndUpdate(
      req.params.threadId,
      {
        $push: {
          replies: {
            content,
            author: req.user._id
          }
        },
        $set: { lastActivity: new Date() }
      },
      { new: true }
    ).populate('replies.author', 'name email');

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    res.json({
      success: true,
      data: { thread }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to post reply',
      error: error.message
    });
  }
});

// Like a thread
router.post('/thread/:threadId/like', protect, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const likeIndex = thread.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      thread.likes.splice(likeIndex, 1);
    } else {
      thread.likes.push(req.user._id);
    }

    await thread.save();

    res.json({
      success: true,
      data: { likes: thread.likes.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to like thread',
      error: error.message
    });
  }
});

// Like a reply
router.post('/thread/:threadId/reply/:replyId/like', protect, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId);

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }

    const reply = thread.replies.id(req.params.replyId);
    
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found'
      });
    }

    const likeIndex = reply.likes.indexOf(req.user._id);
    
    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push(req.user._id);
    }

    await thread.save();

    res.json({
      success: true,
      data: { likes: reply.likes.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to like reply',
      error: error.message
    });
  }
});

export default router;