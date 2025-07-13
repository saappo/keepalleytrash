const jwt = require('jsonwebtoken');

// Custom session middleware for Vercel serverless compatibility
const createSessionMiddleware = () => {
  return (req, res, next) => {
    // Parse session from JWT token in cookie
    const token = req.cookies?.session_token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY || 'dev-secret-key');
        req.session = decoded;
        console.log('Session restored from JWT:', {
          userId: req.session.userId,
          user: req.session.user ? 'logged in' : 'not logged in'
        });
      } catch (error) {
        console.log('Invalid JWT token, clearing session');
        req.session = {};
        res.clearCookie('session_token');
      }
    } else {
      req.session = {};
    }

    // Add session methods
    req.session.save = (callback) => {
      try {
        const token = jwt.sign(req.session, process.env.SECRET_KEY || 'dev-secret-key', {
          expiresIn: '24h'
        });
        
        res.cookie('session_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: 'lax'
        });
        
        if (callback) callback(null);
      } catch (error) {
        if (callback) callback(error);
      }
    };

    req.session.destroy = (callback) => {
      req.session = {};
      res.clearCookie('session_token');
      if (callback) callback(null);
    };

    next();
  };
};

module.exports = { createSessionMiddleware }; 