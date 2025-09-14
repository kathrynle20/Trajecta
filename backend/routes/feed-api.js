const express = require('express');
const router = express.Router();
const { pool, userDb } = require('../db');
require('dotenv').config({ path: '../frontend/.env' });

// POST endpoint to create a new community
router.post('/create-community', async (req, res) => {
  try {
    const { user, forum } = req.body;
    console.log("Creating community - user:", user, "forum:", forum);
    
    // Validate required fields
    if (!forum || !forum.name || !forum.description) {
      return res.status(400).json({
        success: false,
        message: 'Forum name and description are required'
      });
    }

    if (!user || !user.id) {
      return res.status(400).json({
        success: false,
        message: 'User information is required'
      });
    }

    // Convert frontend user data to Google profile format for database functions
    const googleProfile = {
      id: user.id,
      displayName: user.name,
      emails: [{ value: user.email }],
      photos: [{ value: user.photo }]
    };
    
    // Insert community into database
    const dbUser = await userDb.createCommunity(googleProfile, forum);
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community',
      error: error.message
    });
  }
});

// POST endpoint to find all communities for specified user
router.post('/find-communities', async (req, res) => {
  try {
    const { user } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({
        success: false,
        message: 'User information is required'
      });
    }

    // Convert frontend user data to Google profile format for database functions
    const googleProfile = {
      id: user.id,
      displayName: user.name,
      emails: [{ value: user.email }],
      photos: [{ value: user.photo }]
    };
    
    // Get communities for user from database
    const communities = await userDb.findCommunitiesForUser(googleProfile);
    
    res.status(200).json({
      success: true,
      message: 'Communities retrieved successfully',
      communities: communities
    });
  } catch (error) {
    console.error('Error finding community:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find community',
      error: error.message
    });
  }
});

// POST endpoint to create post
router.post('/create-post', async (req, res) => {
  try {
    const { user, forum, post } = req.body;

    if (!user || !user.id) {
      return res.status(400).json({
        success: false,
        message: 'User information is required'
      });
    }

    // Convert frontend user data to Google profile format for database functions
    const googleProfile = {
      id: user.id,
      displayName: user.name,
      emails: [{ value: user.email }],
      photos: [{ value: user.photo }]
    };
    
    // Create post for user from database
    const posts = await userDb.createPost(googleProfile, forum, post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error.message
    });
  }
});

// POST endpoint to create post
router.post('/find-posts', async (req, res) => {
  try {
    const { forum} = req.body;

    // Get post for community
    const posts = await userDb.findPostsForCommunity(forum);
  } catch (error) {
    console.error('Error finding posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find posts',
      error: error.message
    });
  }
});

module.exports = router;