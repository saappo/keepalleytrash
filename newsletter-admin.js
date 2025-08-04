const NewsletterGenerator = require('./newsletter-generator');
const path = require('path');

// Admin route for newsletter management
function setupNewsletterRoutes(app) {
  // Generate and preview newsletter
  app.get('/admin/newsletter/preview', requireAdmin, async (req, res) => {
    try {
      const generator = new NewsletterGenerator();
      const html = await generator.generateNewsletterHTML();
      
      res.render('admin/newsletter-preview', {
        user: req.session.user,
        newsletterHTML: html,
        title: 'Newsletter Preview'
      });
    } catch (error) {
      console.error('Error generating newsletter preview:', error);
      res.status(500).render('errors/error', {
        user: req.session.user,
        error_code: 500,
        error_message: 'Failed to generate newsletter preview'
      });
    }
  });

  // Generate PDF newsletter
  app.get('/admin/newsletter/pdf', requireAdmin, async (req, res) => {
    try {
      const generator = new NewsletterGenerator();
      const pdf = await generator.generatePDF();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=keepalleytrash-newsletter.pdf');
      res.send(pdf);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).render('errors/error', {
        user: req.session.user,
        error_code: 500,
        error_message: 'Failed to generate PDF newsletter'
      });
    }
  });

  // Send newsletter to selected subscribers
  app.post('/admin/newsletter/send', requireAdmin, async (req, res) => {
    try {
      const generator = new NewsletterGenerator();
      const personalNote = req.body.personalNote || '';
      const selectedSubscribers = req.body.selectedSubscribers || [];
      
      // Check if email is configured
      if (!process.env.ZOHO_EMAIL_USER || !process.env.ZOHO_EMAIL_PASSWORD) {
        return res.status(500).json({
          success: false,
          error: 'Zoho email configuration missing. Please set ZOHO_EMAIL_USER and ZOHO_EMAIL_PASSWORD environment variables.'
        });
      }
      
      console.log('Sending newsletter with personal note:', personalNote ? 'Yes' : 'No');
      console.log('Selected subscribers:', selectedSubscribers.length);
      
      const result = await generator.sendNewsletter(personalNote, selectedSubscribers);
      
      res.json({
        success: true,
        message: `Newsletter sent successfully! Success: ${result.successCount}, Errors: ${result.errorCount}`,
        details: result
      });
    } catch (error) {
      console.error('Error sending newsletter:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Newsletter management dashboard
  app.get('/admin/newsletter', requireAdmin, async (req, res) => {
    try {
      let subscribers = [];
      
      if (process.env.NODE_ENV === 'production') {
        // Use Supabase in production
        const { supabaseHelpers } = require('./supabase-client');
        const subscribersResult = await supabaseHelpers.getNewsletterSubscribers();
        subscribers = subscribersResult.data || [];
      } else {
        // Use SQLite in development
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./keepalleytrash.db');
        
        subscribers = await new Promise((resolve, reject) => {
          db.all("SELECT email, subscribed_at as created_at FROM newsletter_subscribers WHERE is_active = 1", (err, rows) => {
            db.close();
            if (err) {
              console.error('Error getting subscribers from database:', err);
              reject(err);
            } else {
              console.log(`Found ${rows.length} subscribers in database for admin page`);
              resolve(rows || []);
            }
          });
        });
      }
      
      res.render('admin/newsletter', {
        user: req.session.user,
        subscribers: subscribers,
        title: 'Newsletter Management'
      });
    } catch (error) {
      console.error('Error loading newsletter dashboard:', error);
      res.status(500).render('errors/error', {
        user: req.session.user,
        error_code: 500,
        error_message: 'Failed to load newsletter dashboard'
      });
    }
  });
}

// Admin middleware (you already have this in server.js)
function requireAdmin(req, res, next) {
  console.log('🔍 Newsletter Admin check:', {
    userId: req.session?.userId,
    user: req.session?.user,
    isAdmin: req.session?.isAdmin,
    userIsAdmin: req.session?.user?.isAdmin,
    userIs_admin: req.session?.user?.is_admin
  });
  
  // Check multiple possible admin flags
  const isAdmin = req.session?.isAdmin || 
                  req.session?.user?.isAdmin || 
                  req.session?.user?.is_admin;
  
  if (req.session?.userId && isAdmin) {
    console.log('✅ Newsletter Admin access granted');
    next();
  } else {
    console.log('❌ Newsletter Admin access denied');
    res.status(403).render('errors/error', {
      user: req.session.user,
      error_code: 403,
      error_message: 'Access denied. Admin privileges required.'
    });
  }
}

module.exports = { setupNewsletterRoutes }; 