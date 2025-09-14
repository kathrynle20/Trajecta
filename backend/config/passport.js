const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// require('dotenv').config({ path: '../../frontend/.env' });

console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET);

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: "397134807119-o9k9jht5eoacnbgqg92hm86sljsh64e7.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Here you would typically save user to database
        // For now, we'll just return the profile
        const user = {
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0].value
        };
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
