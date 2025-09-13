const express = require('express');
const passport = require('passport');
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
        // Successful authentication, redirect to dashboard or home
        res.redirect('/dashboard');
    }
);

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
