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

  // Send newsletter to all subscribers
  app.post('/admin/newsletter/send', requireAdmin, async (req, res) => {
    try {
      const generator = new NewsletterGenerator();
      
      // Check if email is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        return res.status(500).json({
          success: false,
          error: 'Email configuration missing. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.'
        });
      }
      
      await generator.sendNewsletter();
      
      res.json({
        success: true,
        message: 'Newsletter sent successfully to all subscribers'
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
      const { supabaseHelpers } = require('./supabase-client');
      const subscribersResult = await supabaseHelpers.getNewsletterSubscribers();
      const subscribers = subscribersResult.data || [];
      
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
  if (req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(403).render('errors/error', {
      user: req.session.user,
      error_code: 403,
      error_message: 'Access denied. Admin privileges required.'
    });
  }
}

module.exports = { setupNewsletterRoutes }; 