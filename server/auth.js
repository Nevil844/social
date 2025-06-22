const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const userManager = require('./users');

// JWT secret (in production, use a strong secret from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Create or update user
      const user = userManager.createOrUpdateUser(profile);
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
  const user = userManager.getUser(id);
  done(null, user);
});

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  // Check session first
  if (req.isAuthenticated()) {
    return next();
  }

  // Check JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      const user = userManager.getUser(decoded.id);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }

  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user is premium
const isPremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isPremium) {
    return res.status(403).json({ error: 'Premium subscription required' });
  }

  next();
};

// Middleware to check video call limits
const checkVideoCallLimit = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!userManager.canMakeVideoCall(req.user.id)) {
    const remaining = userManager.getRemainingVideoCalls(req.user.id);
    return res.status(429).json({ 
      error: 'Video call limit exceeded',
      remaining,
      limit: req.user.videoCallLimit,
      isPremium: req.user.isPremium
    });
  }

  next();
};

module.exports = {
  passport,
  generateToken,
  verifyToken,
  isAuthenticated,
  isPremium,
  checkVideoCallLimit
}; 