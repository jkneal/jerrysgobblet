const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Extract user data from Google profile
            const googleId = profile.id;
            const email = profile.emails[0].value;
            const firstName = profile.name.givenName;
            const lastName = profile.name.familyName;
            const avatarUrl = profile.photos[0]?.value;

            // Check if user already exists
            let user = await User.findByGoogleId(googleId);

            if (user) {
                // Update existing user's info (in case they changed their Google profile)
                user = await User.update(user.id, {
                    firstName,
                    lastName,
                    avatarUrl
                });
            } else {
                // Create new user
                user = await User.create({
                    googleId,
                    email,
                    firstName,
                    lastName,
                    avatarUrl
                });
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
