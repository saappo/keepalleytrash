const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const dbPath = process.env.NODE_ENV === 'production' ? ':memory:' : './keepalleytrash.db';
console.log(`Using database: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

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
  )`);

  // Posts table
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER NOT NULL,
    category TEXT DEFAULT 'general',
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

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
  )`);

  // Contact table
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Subscribers table
  db.run(`CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create admin user if none exists
  db.get("SELECT * FROM users WHERE is_admin = 1", (err, row) => {
    if (!row) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
              VALUES (?, ?, ?, ?)`, 
              ['admin', 'admin@keepalleytrash.com', adminPassword, 1]);
    }
  });
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('static'));

// Session configuration
app.use(session({
  secret: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Handlebars setup with helpers
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    formatDate: function (date) {
      if (!date) return '';
      const d = new Date(date);
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
  if (req.session.userId) {
    next();
  } else {
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
if (process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });
}

// Routes
app.get('/', (req, res) => {
  console.log('Home route accessed');
  try {
    res.render('index', { user: req.session.user });
  } catch (error) {
    console.error('Error rendering index:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/welcome', (req, res) => {
  res.render('welcome', { user: req.session.user });
});

app.get('/home', (req, res) => {
  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 5", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('home', { posts, user: req.session.user });
  });
});

app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  res.render('register', { user: req.session.user, errors: [] });
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
], (req, res) => {
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

  db.run(`INSERT INTO users (username, email, password_hash, neighborhood) VALUES (?, ?, ?, ?)`,
    [username, email, passwordHash, neighborhood],
    function(err) {
      if (err) {
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
      res.redirect('/login');
    }
  );
});

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home');
  }
  res.render('login', { user: req.session.user, errors: [] });
});

app.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('login', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.render('login', { 
        user: req.session.user, 
        errors: [{ msg: 'Invalid email or password' }],
        formData: req.body 
      });
    }

    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      neighborhood: user.neighborhood,
      isAdmin: user.is_admin
    };
    req.session.isAdmin = user.is_admin;

    res.redirect('/home');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/home');
});

app.get('/community', (req, res) => {
  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('community', { posts, user: req.session.user });
  });
});

app.get('/cleanup', (req, res) => {
  res.render('cleanup', { user: req.session.user });
});

app.get('/about', (req, res) => {
  res.render('about', { user: req.session.user });
});

app.get('/considerations', (req, res) => {
  res.render('considerations', { user: req.session.user });
});

app.get('/submit', requireAuth, (req, res) => {
  res.render('submit', { user: req.session.user, errors: [] });
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
  db.all("SELECT s.*, u.username FROM suggestions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC", (err, suggestions) => {
    if (err) {
      console.error(err);
      suggestions = [];
    }
    res.render('suggestions', { suggestions, user: req.session.user });
  });
});

app.get('/submit_suggestion', requireAuth, (req, res) => {
  res.render('submit_suggestion', { user: req.session.user, errors: [] });
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
  res.render('contact', { user: req.session.user, errors: [] });
});

app.post('/contact', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('contact', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { name, email, subject, message } = req.body;

  db.run(`INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name, email, subject, message],
    function(err) {
      if (err) {
        console.error(err);
        return res.render('contact', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to send message' }],
          formData: req.body 
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
    }
  );
});

app.get('/subscribe', (req, res) => {
  res.render('subscribe', { user: req.session.user, errors: [] });
});

app.post('/subscribe', [
  body('email').isEmail().withMessage('Please enter a valid email')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('subscribe', { 
      user: req.session.user, 
      errors: errors.array(),
      formData: req.body 
    });
  }

  const { email } = req.body;

  db.run(`INSERT OR IGNORE INTO subscribers (email) VALUES (?)`,
    [email],
    function(err) {
      if (err) {
        console.error(err);
        return res.render('subscribe', { 
          user: req.session.user, 
          errors: [{ msg: 'Failed to subscribe' }],
          formData: req.body 
        });
      }
      res.redirect('/home');
    }
  );
});

app.get('/profile', requireAuth, (req, res) => {
  res.render('user/profile', { user: req.session.user });
});

// Admin routes
app.get('/admin/dashboard', requireAdmin, (req, res) => {
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
});

app.get('/admin/posts', requireAdmin, (req, res) => {
  db.all("SELECT p.*, u.username FROM posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC", (err, posts) => {
    if (err) {
      console.error(err);
      posts = [];
    }
    res.render('admin/posts', { posts, user: req.session.user });
  });
});

// Error handlers
app.use((req, res) => {
  res.status(404).render('errors/error', { 
    user: req.session.user,
    error_code: 404, 
    error_message: "Page not found" 
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/error', { 
    user: req.session.user,
    error_code: 500, 
    error_message: "Internal server error" 
  });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app; 