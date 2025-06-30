const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const userManager = require('./users');

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'REDACTED-GOOGLE-CLIENT-ID',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'REDACTED-GOOGLE-CLIENT-SECRET',
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
}));

// Serialize/deserialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const user = userManager.getUser(id);
  done(null, user);
});

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'social-jwt-secret', {
    expiresIn: '24h'
  });
};

// Middleware to verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'social-jwt-secret');
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = verifyToken(token);
    const user = userManager.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  passport,
  generateToken,
  verifyToken,
  isAuthenticated
}; 