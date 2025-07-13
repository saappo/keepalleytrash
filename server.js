const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createSessionMiddleware } = require('./session-middleware');
require('dotenv').config();

// Import Supabase client
const { supabaseHelpers } = require('./supabase-client');

// Check for required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SECRET_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please set these in your Vercel project settings');
  } else {
    console.log('✅ All required environment variables are set');
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup - SQLite only for development
const dbPath = './keepalleytrash.db';
console.log(`Using database: ${dbPath}`);

// In production (Vercel), we'll use Supabase for data storage
// SQLite is only used for development

// Initialize database
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }
      console.log('Database connected successfully');
      
      // Create tables if they don't exist
      db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          neighborhood TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_admin BOOLEAN DEFAULT 0
        )`, (err) => {
          if (err) console.error('Error creating users table:', err);
          else console.log('Users table ready');
        });

        // Posts table
        db.run(`CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL,
          category TEXT DEFAULT 'general',
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
          if (err) console.error('Error creating posts table:', err);
          else console.log('Posts table ready');
        });

        // Suggestions table
        db.run(`CREATE TABLE IF NOT EXISTS suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
          if (err) console.error('Error creating suggestions table:', err);
          else console.log('Suggestions table ready');
        });

        // Contact table
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
          if (err) console.error('Error creating contacts table:', err);
          else console.log('Contacts table ready');
        });

        // Newsletter subscribers table
        db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT 1
        )`, (err) => {
          if (err) console.error('Error creating newsletter_subscribers table:', err);
          else console.log('Newsletter subscribers table ready');
        });

        // Create admin user if none exists
        db.get("SELECT * FROM users WHERE is_admin = 1", (err, row) => {
          if (err) {
            console.error('Error checking for admin user:', err);
          } else if (!row) {
            const adminPassword = bcrypt.hashSync('admin123', 10);
            db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
                    VALUES (?, ?, ?, ?)`, 
                    ['admin', 'admin@keepalleytrash.com', adminPassword, 1], (err) => {
              if (err) console.error('Error creating admin user:', err);
              else console.log('Admin user created successfully');
            });
          } else {
            console.log('Admin user already exists');
          }
        });

        // Finalize database setup
        db.run("PRAGMA foreign_keys = ON", (err) => {
          if (err) console.error('Error enabling foreign keys:', err);
          else console.log('Foreign keys enabled');
          resolve(db);
        });
      });
    });
  });
};

// Initialize database and store reference
let db;
let dbReady = false;

// In production, skip SQLite initialization since we use Supabase
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production mode: Using Supabase for data storage');
  dbReady = true; // Mark as ready since we'll use Supabase
} else {
  // Development mode: Initialize SQLite
  initializeDatabase()
    .then((database) => {
      db = database;
      dbReady = true;
      console.log('Database initialization complete');
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
      process.exit(1);
    });
}

// Database operation wrapper
const dbOperation = (operation) => {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'production') {
      // In production, redirect to Supabase operations
      reject(new Error('SQLite operations not available in production. Use Supabase instead.'));
      return;
    }
    
    if (!dbReady) {
      reject(new Error('Database not ready'));
      return;
    }
    operation(db, resolve, reject);
  });
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('static'));
app.use(cookieParser());

// Database ready middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, we're always ready since we use Supabase
    next();
  } else if (!dbReady) {
    return res.status(503).render('errors/error', { 
      user: req.session ? req.session.user : null,
      error_code: 503, 
      error_message: "Database is initializing, please try again in a moment" 
    });
  } else {
    next();
  }
});

// Session configuration
if (process.env.NODE_ENV === 'production') {
  // Use custom JWT-based session middleware for Vercel
  app.use(createSessionMiddleware());
} else {
  // Use express-session with SQLite store for development
  app.use(session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: './',
      table: 'sessions'
    }),
    secret: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    },
    name: 'keepalleytrash.sid'
  }));
}

// Handlebars setup with helpers
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    formatDate: function (date, format) {
      if (!date) return '';
      const d = new Date(date);
      if (format && typeof format === 'string') {
        // Handle the specific format used in index.handlebars
        if (format.includes('MMMM Do, YYYY [at] h:mm A')) {
          const month = d.toLocaleDateString('en-US', { month: 'long' });
          const day = d.getDate();
          const year = d.getFullYear();
          const time = d.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          return `${month} ${day}, ${year} at ${time}`;
        }
        // Handle other format patterns
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const day = d.getDate();
        const year = d.getFullYear();
        const time = d.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        return `${month} ${day}, ${year} at ${time}`;
      }
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    },
    truncate: function (str, length) {
      if (!str) return '';
      if (str.length <= length) return str;
      return str.substring(0, length) + '...';
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('Auth check - userId:', req.session.userId, 'user:', req.session.user);
  if (req.session.userId) {
    next();
  } else {
    console.log('User not authenticated, redirecting to login');
    res.redirect('/login');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.session.userId && req.session.isAdmin) {
    next();
  } else {
    res.redirect('/home');
  }
};

// Email transporter (only if credentials are provided)
let transporter = null;
if (
  process.env.MAIL_USERNAME &&
  process.env.MAIL_PASSWORD &&
  process.env.MAIL_HOST &&
  process.env.MAIL_PORT
) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT, 10),
    secure: process.env.MAIL_SECURE === 'true', // convert string to boolean
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });
}

// Routes
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "set" : "missing");
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing");
console.log("SECRET_KEY:", process.env.SECRET_KEY ? "set" : "missing");

// Health check route that always responds
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    node_env: process.env.NODE_ENV,
    supabase_url: process.env.SUPABASE_URL ? 'set' : 'missing',
    supabase_anon_key: process.env.SUPABASE_ANON_KEY ? 'set' : 'missing',
    supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
    secret_key: process.env.SECRET_KEY ? 'set' : 'missing',
    timestamp: new Date().toISOString()
  });
});

// Simple test route that doesn't depend on database
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running',
    user: req.session.user ? 'logged in' : 'not logged in',
    timestamp: new Date().toISOString()
  });
});

// Simple test route that renders a basic template
app.get('/test-render', (req, res) => {
  try {
    res.render('index', { 
      user: null,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error in test-render:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.get('/', (req, res) => {
  console.log('Home route accessed');
  console.log('Session data:', {
    userId: req.session?.userId,
    user: req.session?.user,
    isAdmin: req.session?.isAdmin
  });
  
  try {
    const renderData = { 
      user: req.session ? req.session.user : null
    };
    console.log('Rendering index with data:', renderData);
    res.render('index', renderData);
  } catch (error) {
    console.error('Error rendering index:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error rendering home page',
      message: error.message,
      stack: error.stack
    });
  }
});

app.get('/welcome', (req, res) => {
  res.render('welcome', { user: req.session ? req.session.user : null });
});

app.get('/home', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, get posts from Supabase
    try {
      const postsResult = await supabaseHelpers.getPosts();
      if (postsResult.success) {
        // Transform the data to match the expected format
        const posts = postsResult.data.map(post => ({
          ...post,
          username: post.users?.username || 'Unknown User'
        }));
        res.render('home', { 
          posts: posts.slice(0, 5), // Limit to 5 posts
          user: req.session ? req.session.user : null
        });
      } else {
        console.error('Error fetching posts from Supabase:', postsResult.error);
        res.render('home', { 
          posts: [], 
          user: req.session ? req.session.user : null
        });
      }
    } catch (error) {
      console.error('Error in Supabase posts fetch:', error);
      res.render('home', { 
        posts: [], 
        user: req.session ? req.session.user : null
      });
    }
    return;
  }
  
  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 5", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('home', { posts, user: req.session ? req.session.user : null });
  });
});

app.get('/register', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/home');
  }
  res.render('register', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('Username must be between 3 and 20 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('register', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { username, email, password, neighborhood } = req.body;
  const passwordHash = bcrypt.hashSync(password, 10);

  // In production, use Supabase for user registration
  if (process.env.NODE_ENV === 'production') {
    try {
      // Create user in Supabase
      const userResult = await supabaseHelpers.createUser(username, email, passwordHash, neighborhood);
      
      if (!userResult.success) {
        return res.render('register', { 
          user: req.session.user, 
          errors: [{ msg: userResult.error }],
          formData: req.body 
        });
      }

      // Automatically subscribe to newsletter via Supabase
      try {
        const newsletterResult = await supabaseHelpers.subscribeToNewsletter(email);
        if (newsletterResult.success) {
          console.log('User automatically subscribed to newsletter via Supabase:', email);
        } else {
          console.error('Error subscribing to newsletter via Supabase:', newsletterResult.error);
          // Don't fail registration if newsletter subscription fails
        }
      } catch (newsletterError) {
        console.error('Error subscribing to newsletter via Supabase:', newsletterError);
        // Don't fail registration if newsletter subscription fails
      }

      console.log('User registered successfully via Supabase:', username);
      
      // Automatically log the user in after registration
      req.session.userId = userResult.data.id;
      req.session.user = {
        id: userResult.data.id,
        username: userResult.data.username,
        email: userResult.data.email,
        neighborhood: userResult.data.neighborhood,
        isAdmin: userResult.data.is_admin
      };
      req.session.isAdmin = userResult.data.is_admin;
      
      req.session.save((err) => {
        if (err) {
          console.error('Session save error after registration:', err);
          res.redirect('/login');
        } else {
          console.log('Session saved successfully after registration for user:', username);
          res.redirect('/home');
        }
      });
      return;
    } catch (error) {
      console.error('Error in Supabase registration process:', error);
      return res.render('register', { 
        user: req.session.user, 
        errors: [{ msg: 'Registration failed. Please try again.' }],
        formData: req.body 
      });
    }
  }

  try {
    // Use transaction to ensure both user creation and newsletter subscription succeed or fail together
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Create user
      db.run(`INSERT INTO users (username, email, password_hash, neighborhood) VALUES (?, ?, ?, ?)`,
        [username, email, passwordHash, neighborhood],
        async function(err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.render('register', { 
                user: req.session.user, 
                errors: [{ msg: 'Username or email already exists' }],
                formData: req.body 
              });
            }
            return res.render('register', { 
              user: req.session.user, 
              errors: [{ msg: 'Registration failed' }],
              formData: req.body 
            });
          }
          
          // Automatically subscribe to newsletter via Supabase
          try {
            const newsletterResult = await supabaseHelpers.subscribeToNewsletter(email);
            if (newsletterResult.success) {
              console.log('User automatically subscribed to newsletter via Supabase:', email);
            } else {
              console.error('Error subscribing to newsletter via Supabase:', newsletterResult.error);
              // Don't fail registration if newsletter subscription fails
            }
          } catch (newsletterError) {
            console.error('Error subscribing to newsletter via Supabase:', newsletterError);
            // Don't fail registration if newsletter subscription fails
          }
          
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing transaction:', err);
              db.run('ROLLBACK');
              return res.render('register', { 
                user: req.session.user, 
                errors: [{ msg: 'Registration failed' }],
                formData: req.body 
              });
            }
            console.log('User registered successfully:', username);
            res.redirect('/login');
          });
        }
      );
    });
  } catch (error) {
    console.error('Error in registration process:', error);
    res.render('register', { 
      user: req.session.user, 
      errors: [{ msg: 'Registration failed. Please try again.' }],
      formData: req.body 
    });
  }
});

app.get('/login', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/home');
  }
  res.render('login', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { email, password } = req.body;
  console.log('Login attempt for email:', email);

  // In production, use Supabase for user authentication
  if (process.env.NODE_ENV === 'production') {
    try {
      const userResult = await supabaseHelpers.getUserByEmail(email);
      
      if (!userResult.success) {
        console.log('User not found for email:', email);
        return res.render('login', { 
          user: req.session.user, 
          errors: [{ msg: 'Invalid email or password' }],
          formData: req.body 
        });
      }

      const user = userResult.data;

      if (!bcrypt.compareSync(password, user.password_hash)) {
        console.log('Invalid password for user:', user.username);
        return res.render('login', { 
          user: req.session.user, 
          errors: [{ msg: 'Invalid email or password' }],
          formData: req.body 
        });
      }

      console.log('Successful login for user via Supabase:', user.username);
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        neighborhood: user.neighborhood,
        isAdmin: user.is_admin
      };
      req.session.isAdmin = user.is_admin;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.render('login', { 
            user: req.session.user, 
            errors: [{ msg: 'Session error occurred' }],
            formData: req.body 
          });
        }
        console.log('Session saved successfully for user:', user.username);
        res.redirect('/home');
      });
      return;
    } catch (error) {
      console.error('Error in Supabase login process:', error);
      return res.render('login', { 
        user: req.session.user, 
        errors: [{ msg: 'Login failed. Please try again.' }],
        formData: req.body 
      });
    }
  }

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.render('login', { 
        user: req.session.user, 
        errors: [{ msg: 'Database error occurred' }],
        formData: req.body 
      });
    }
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.render('login', { 
        user: req.session.user, 
        errors: [{ msg: 'Invalid email or password' }],
        formData: req.body 
      });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      console.log('Invalid password for user:', user.username);
      return res.render('login', { 
        user: req.session.user, 
        errors: [{ msg: 'Invalid email or password' }],
        formData: req.body 
      });
    }

    console.log('Successful login for user:', user.username);
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      neighborhood: user.neighborhood,
      isAdmin: user.is_admin
    };
    req.session.isAdmin = user.is_admin;

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('login', { 
          user: req.session.user, 
          errors: [{ msg: 'Session error occurred' }],
          formData: req.body 
        });
      }
      console.log('Session saved successfully for user:', user.username);
      res.redirect('/home');
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/home');
});

app.get('/community', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, get posts from Supabase
    try {
      const postsResult = await supabaseHelpers.getPosts();
      if (postsResult.success) {
        // Transform the data to match the expected format
        const posts = postsResult.data.map(post => ({
          ...post,
          username: post.users?.username || 'Unknown User'
        }));
        res.render('community', { 
          posts: posts,
          user: req.session ? req.session.user : null
        });
      } else {
        console.error('Error fetching posts from Supabase:', postsResult.error);
        res.render('community', { 
          posts: [], 
          user: req.session ? req.session.user : null
        });
      }
    } catch (error) {
      console.error('Error in Supabase posts fetch:', error);
      res.render('community', { 
        posts: [], 
        user: req.session ? req.session.user : null
      });
    }
    return;
  }

  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('community', { posts, user: req.session ? req.session.user : null });
  });
});

app.get('/cleanup', (req, res) => {
  try {
    res.render('cleanup', { user: req.session ? req.session.user : null });
  } catch (error) {
    console.error('Error rendering cleanup page:', error);
    res.status(500).render('errors/error', { 
      user: req.session ? req.session.user : null,
      error_code: 500, 
      error_message: "Error loading cleanup page" 
    });
  }
});

app.get('/about', (req, res) => {
  try {
    res.render('about', { user: req.session ? req.session.user : null });
  } catch (error) {
    console.error('Error rendering about page:', error);
    res.status(500).render('errors/error', { 
      user: req.session ? req.session.user : null,
      error_code: 500, 
      error_message: "Error loading about page" 
    });
  }
});

app.get('/considerations', (req, res) => {
  try {
    res.render('considerations', { user: req.session ? req.session.user : null });
  } catch (error) {
    console.error('Error rendering considerations page:', error);
    res.status(500).render('errors/error', { 
      user: req.session ? req.session.user : null,
      error_code: 500, 
      error_message: "Error loading considerations page" 
    });
  }
});

app.get('/guidelines', (req, res) => {
  res.render('guidelines', { 
    user: req.session ? req.session.user : null,
    lastUpdated: new Date()
  });
});

app.get('/submit', requireAuth, (req, res) => {
  res.render('submit', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/submit', requireAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').isIn(['general', 'cleanup', 'issue', 'announcement']).withMessage('Invalid category')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('submit', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { title, content, category } = req.body;

  db.run(`INSERT INTO posts (title, content, category, user_id) VALUES (?, ?, ?, ?)`,
    [title, content, category, req.session.userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.render('submit', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to create post' }],
          formData: req.body 
        });
      }
      res.redirect('/community');
    }
  );
});

app.get('/suggestions', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production, show empty suggestions (no Supabase table for suggestions yet)
      res.render('suggestions', { 
        suggestions: [], 
        user: req.session ? req.session.user : null,
        productionMessage: 'Suggestions feature is currently not available in production.'
      });
      return;
    }

    if (!dbReady) {
      // Return empty suggestions instead of error
      return res.render('suggestions', { suggestions: [], user: req.session ? req.session.user : null });
    }
    
    db.all("SELECT s.*, u.username FROM suggestions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC", (err, suggestions) => {
      if (err) {
        console.error('Database error in suggestions route:', err);
        suggestions = [];
      }
      res.render('suggestions', { suggestions, user: req.session ? req.session.user : null });
    });
  } catch (error) {
    console.error('Error in suggestions route:', error);
    // Return empty suggestions instead of error
    res.render('suggestions', { suggestions: [], user: req.session ? req.session.user : null });
  }
});

app.get('/submit_suggestion', requireAuth, (req, res) => {
  res.render('submit_suggestion', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/submit_suggestion', requireAuth, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['cleanup', 'safety', 'community', 'other']).withMessage('Invalid category')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('submit_suggestion', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { title, description, category } = req.body;

  db.run(`INSERT INTO suggestions (title, description, category, user_id) VALUES (?, ?, ?, ?)`,
    [title, description, category, req.session.userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.render('submit_suggestion', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to submit suggestion' }],
          formData: req.body 
        });
      }
      res.redirect('/suggestions');
    }
  );
});

app.get('/contact', (req, res) => {
  res.render('contact', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/contact', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('contact', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { name, email, subject, message } = req.body;

  try {
    if (process.env.NODE_ENV === 'production') {
      // Production: Submit to Supabase
      const result = await supabaseHelpers.submitContact(name, email, subject, message);
      
      if (!result.success) {
        console.error('Supabase contact submission failed:', result.error);
        return res.render('contact', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to send message. Please try again.' }],
          formData: req.body 
        });
      }

      console.log('Contact form submitted to Supabase successfully');
    } else {
      // Development: Submit to SQLite
      await dbOperation((db, resolve, reject) => {
        db.run(
          'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
          [name, email, subject, message],
          function(err) {
            if (err) {
              console.error('Error inserting contact:', err);
              reject(err);
            } else {
              console.log('Contact form submitted to SQLite successfully');
              resolve();
            }
          }
        );
      });
    }

    // Send email notification if configured
    if (transporter) {
      const mailOptions = {
        from: email,
        to: 'info@saappo.com',
        subject: `New Contact Form Submission: ${subject}`,
        text: `
          Name: ${name}
          Email: ${email}
          Subject: ${subject}
          Message: ${message}
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email sending failed:', error);
        }
      });
    }

    res.redirect('/contact');
  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.render('contact', { 
      user: req.session.user, 
      errors: [{ msg: 'Failed to send message. Please try again.' }],
      formData: req.body 
    });
  }
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe', { user: req.session ? req.session.user : null, errors: [] });
});

app.post('/subscribe', [
  body('email').isEmail().withMessage('Please enter a valid email')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('subscribe', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { email } = req.body;
  console.log('Newsletter subscription attempt for:', email);

  try {
    if (process.env.NODE_ENV === 'production') {
      // Production: Subscribe via Supabase
      const result = await supabaseHelpers.subscribeToNewsletter(email);
      
      if (!result.success) {
        console.error('Supabase newsletter subscription failed:', result.error);
        return res.render('subscribe', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to subscribe to newsletter. Please try again.' }],
          formData: req.body 
        });
      }

      if (result.message === 'Email already subscribed') {
        console.log('Email already subscribed to newsletter:', email);
        req.flash = req.flash || {};
        req.flash.info = 'This email is already subscribed to our newsletter.';
      } else {
        console.log('New newsletter subscriber added to Supabase:', email);
        req.flash = req.flash || {};
        req.flash.success = 'Successfully subscribed to newsletter!';
      }
    } else {
      // Development: Subscribe via SQLite
      await dbOperation((db, resolve, reject) => {
        db.run(
          'INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)',
          [email],
          function(err) {
            if (err) {
              console.error('Error inserting newsletter subscriber:', err);
              reject(err);
            } else {
              if (this.changes > 0) {
                console.log('New newsletter subscriber added to SQLite:', email);
                req.flash = req.flash || {};
                req.flash.success = 'Successfully subscribed to newsletter!';
              } else {
                console.log('Email already subscribed to newsletter:', email);
                req.flash = req.flash || {};
                req.flash.info = 'This email is already subscribed to our newsletter.';
              }
              resolve();
            }
          }
        );
      });
    }
    
    res.redirect('/home');
  } catch (error) {
    console.error('Error in newsletter subscription:', error);
    res.render('subscribe', { 
      user: req.session.user, 
      errors: [{ msg: 'Failed to subscribe to newsletter. Please try again.' }],
      formData: req.body 
    });
  }
});

app.get('/profile', requireAuth, (req, res) => {
  res.render('user/profile', { user: req.session ? req.session.user : null });
});

// Admin routes
app.get('/admin/dashboard', requireAdmin, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, show a simplified dashboard with Supabase data
    res.render('admin/dashboard', {
      user: req.session.user,
      users_count: 'N/A (Use Supabase Dashboard)',
      posts_count: 'N/A (Use Supabase Dashboard)',
      suggestions_count: 'N/A (Use Supabase Dashboard)',
      contacts_count: 'N/A (Use Supabase Dashboard)'
    });
  } else {
    // Development mode: Use SQLite
    db.get("SELECT COUNT(*) as count FROM users", (err, usersResult) => {
      db.get("SELECT COUNT(*) as count FROM posts", (err, postsResult) => {
        db.get("SELECT COUNT(*) as count FROM suggestions", (err, suggestionsResult) => {
          db.get("SELECT COUNT(*) as count FROM contacts", (err, contactsResult) => {
            res.render('admin/dashboard', {
              user: req.session.user,
              users_count: usersResult.count,
              posts_count: postsResult.count,
              suggestions_count: suggestionsResult.count,
              contacts_count: contactsResult.count
            });
          });
        });
      });
    });
  }
});

app.get('/admin/posts', requireAdmin, (req, res) => {
  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('admin/posts', { posts, user: req.session ? req.session.user : null });
  });
});

// Error handlers
app.use((req, res) => {
  res.status(404).render('errors/error', { 
    user: req.session ? req.session.user : null,
    error_code: 404, 
    error_message: "Page not found" 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/error', { 
    user: req.session ? req.session.user : null,
    error_code: 500, 
    error_message: "Internal server error" 
  });
});

// Start server only in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export app for Vercel
module.exports = app; 