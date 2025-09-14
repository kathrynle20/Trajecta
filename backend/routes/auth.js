const express = require('express');
const passport = require('passport');
const { userDb } = require('../db');
const router = express.Router();

// Auth with Google
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'] 
    })
);

// Google auth callback
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log("GOOGLE AUTH CALLBACK");
        // Successful authentication, redirect to dashboard or home
        res.redirect('http://localhost:3000/');
    }
);

router.post('/set-user-data', async (req, res) => {
  try {
    const { user } = req.body;
    console.log("user backend:", user);
    
    // Convert frontend user data to Google profile format for database functions
    const googleProfile = {
      google_id: user.google_id,
      displayName: user.name,
      emails: [{ value: user.email }],
      photos: [{ value: user.photo }]
    };
    
    // Save user to database (find existing or create new)
    const dbUser = await userDb.findOrCreateFromGoogleProfile(googleProfile);
    console.log("Database user:", dbUser);
    
    // Store user in session (use database user data)
    req.session.user = dbUser;
    
    // Send success response
    res.json({ 
      success: true, 
      message: 'User data saved to database successfully',
      user: dbUser 
    });
  } catch (error) {
    console.error('Error saving user to database:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save user data to database',
      error: error.message
    });
  }
})

// Logout user
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

// Check if user is authenticated
router.get('/current_user', (req, res) => {
    res.json(req.user);
});

module.exports = router;
