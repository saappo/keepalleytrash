const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const supabaseHelpers = require('./supabase-client');

class NewsletterGenerator {
  constructor() {
    this.transporter = null;
    this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    // Configure for Zoho email service with improved deliverability
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.ZOHO_EMAIL_USER, // your Zoho email
        pass: process.env.ZOHO_EMAIL_PASSWORD // your Zoho app password
      },
      tls: {
        rejectUnauthorized: false
      },
      // Improved deliverability settings
      pool: true, // Use pooled connections
      maxConnections: 5, // Limit concurrent connections
      maxMessages: 100, // Max messages per connection
      rateLimit: 14, // Max 14 messages per second (Zoho limit)
      // DKIM and SPF will be handled by Zoho's infrastructure
    });
  }

  async generateNewsletterHTML() {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });

    // Get recent posts from database
    let posts = [];
    if (process.env.NODE_ENV === 'production') {
      const postsResult = await supabaseHelpers.getPosts();
      posts = postsResult.data || [];
    } else {
      // For development, you might want to add some sample data
      posts = [
        { title: "Sample Post", content: "This is a sample post for the newsletter", created_at: new Date() }
      ];
    }

    // Get council member data
    const councilMembers = [
      { name: "District 9 - Paula Blackmon", status: "waffling", votes: "Needs Action" },
      { name: "District 10 - Kathy Stewart", status: "shameful", votes: "Major Disappointment" },
      { name: "District 11 - William Roth", status: "victory", votes: "Standing Strong" },
      { name: "District 13 - Gay Donnell Willis", status: "misguided", votes: "Poor Performance" }
    ];

    const actionItems = [
      { text: "Sign the petition at change.org", urgent: true },
      { text: "Log in to www.keepalleytrash.com", urgent: false },
      { text: "Share the Council Report Card", urgent: false },
      { text: "Demand quotes from your city council member", urgent: true },
      { text: "Make your voice heard -- Dallas must listen", urgent: true }
    ];

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Keep Alley Trash - Community Update</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          
          .header {
            background: white;
            border-bottom: 4px solid #2563eb;
            padding: 2rem;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5rem;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          
          .header .subtitle {
            color: #2563eb;
            font-weight: 600;
            font-size: 1.1rem;
          }
          
          .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0 8px 8px 0;
          }
          
          .alert-content {
            display: flex;
            align-items: center;
            color: #991b1b;
            font-weight: 500;
          }
          
          .main-content {
            padding: 2rem;
          }
          
          .section {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
            overflow: hidden;
          }
          
          .section-header {
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .section-header h2 {
            font-size: 1.5rem;
            font-weight: bold;
            color: #1e293b;
          }
          
          .section-content {
            padding: 1.5rem;
          }
          
          .council-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          
          .council-member {
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid;
          }
          
          .status-waffling { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
          .status-shameful { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
          .status-victory { background: #dcfce7; color: #166534; border-color: #22c55e; }
          .status-misguided { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
          
          .action-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
          }
          
          .action-item {
            background: rgba(37, 99, 235, 0.1);
            border-radius: 8px;
            padding: 1rem;
            display: flex;
            align-items: start;
            gap: 0.75rem;
          }
          
          .action-item.urgent {
            border: 2px solid #fbbf24;
          }
          
          .action-number {
            background: #2563eb;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 0.875rem;
          }
          
          .action-item.urgent .action-number {
            background: #fbbf24;
            color: #1e293b;
          }
          
          .urgent-badge {
            background: #fbbf24;
            color: #1e293b;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 9999px;
            font-weight: 500;
            margin-top: 0.5rem;
            display: inline-block;
          }
          
          .cta-section {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            text-align: center;
            padding: 2rem;
          }
          
          .cta-section h2 {
            font-size: 2rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
          }
          
          .cta-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1.5rem;
            flex-wrap: wrap;
          }
          
          .cta-button {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
          }
          
          .cta-primary {
            background: #fbbf24;
            color: #1e293b;
          }
          
          .cta-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid white;
          }
          
          .footer {
            background: white;
            text-align: center;
            padding: 2rem;
            border-top: 1px solid #e5e7eb;
          }
          
          .footer h3 {
            font-size: 1.25rem;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          
          .footer p {
            color: #6b7280;
            margin-bottom: 1rem;
          }
          
          @media print {
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Keep Alley Trash</h1>
            <p class="subtitle">Community Update</p>
            <p style="color: #6b7280; margin-top: 0.5rem;">${currentDate}</p>
            
            <div class="alert">
              <div class="alert-content">
                <span style="margin-right: 0.5rem;">🚨</span>
                <span><strong>The City is moving forward and must hear from us NOW.</strong> The City of Dallas is approaching budgets and will eliminate our alley trash service swiftly with no accountability.</span>
              </div>
            </div>
          </div>

          <div class="main-content">
            <!-- Council Member Report Card -->
            <div class="section">
              <div class="section-header">
                <span style="background: #dbeafe; padding: 0.75rem; border-radius: 50%; margin-right: 0.75rem;">👥</span>
                <h2>Council Member Report Card</h2>
              </div>
              <div class="section-content">
                <p style="color: #6b7280; margin-bottom: 1.5rem;">See who is standing with residents</p>
                
                <div class="council-grid">
                  ${councilMembers.map(member => `
                    <div class="council-member">
                      <span style="font-weight: 500;">${member.name}</span>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="status-badge status-${member.status}">${member.status}</span>
                        <span style="font-size: 0.875rem; color: #6b7280;">${member.votes}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                
                <div style="background: #dbeafe; border-radius: 8px; padding: 1rem; text-align: center;">
                  <p style="color: #1e40af; font-weight: 500; margin: 0;">
                    Visit our Council Report Card at www.keepalleytrash.com
                  </p>
                </div>
              </div>
            </div>

            <!-- Missing Quotes Section -->
            <div class="section">
              <div class="section-header">
                <span style="background: #fed7aa; padding: 0.75rem; border-radius: 50%; margin-right: 0.75rem;">💬</span>
                <h2>Missing Quotes from City Leaders</h2>
              </div>
              <div class="section-content">
                <p style="font-size: 1.125rem; line-height: 1.7; margin-bottom: 1rem;">
                  Key city officials have failed to address resident concerns in public. We are demanding 
                  <strong style="color: #ea580c;">transparency, not silence</strong>, as decisions move forward.
                </p>
                <div style="background: #fed7aa; border-left: 4px solid #f97316; padding: 1rem; border-radius: 0 8px 8px 0;">
                  <p style="color: #9a3412; font-weight: 500; margin: 0;">
                    Public accountability requires public statements. Silence is not an option.
                  </p>
                </div>
              </div>
            </div>

            <!-- City Advancing Without Consensus -->
            <div class="section">
              <div class="section-header">
                <span style="background: #fee2e2; padding: 0.75rem; border-radius: 50%; margin-right: 0.75rem;">⚠️</span>
                <h2>City Advancing Without Consensus</h2>
              </div>
              <div class="section-content">
                <p style="font-size: 1.125rem; line-height: 1.7; margin-bottom: 1rem;">
                  Sanitation officials claim safety concerns, but have <strong style="color: #dc2626;">not studied community impacts</strong>.
                </p>
                <div style="background: #f9fafb; padding: 1rem; border-radius: 8px; display: flex; align-items: start; gap: 0.75rem;">
                  <span style="color: #6b7280; margin-top: 0.25rem;">🏠</span>
                  <p style="margin: 0;">
                    Many alleys were built for rear-load service and curbside is not practical for all neighborhoods.
                  </p>
                </div>
              </div>
            </div>

            <!-- Action Items -->
            <div class="section">
              <div class="section-header">
                <span style="background: #dbeafe; padding: 0.75rem; border-radius: 50%; margin-right: 0.75rem;">📋</span>
                <h2>Take Action Today</h2>
              </div>
              <div class="section-content">
                <div class="action-grid">
                  ${actionItems.map((item, index) => `
                    <div class="action-item ${item.urgent ? 'urgent' : ''}">
                      <div class="action-number">${index + 1}</div>
                      <div>
                        <p style="margin: 0; color: #1e293b;">${item.text}</p>
                        ${item.urgent ? '<span class="urgent-badge">URGENT</span>' : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
              <h2>Join the Movement</h2>
              <p style="color: #bfdbfe; font-size: 1.125rem;">Your voice matters. Take action today.</p>
              
              <div class="cta-buttons">
                <a href="https://change.org" class="cta-button cta-primary">Sign Petition Now</a>
                <a href="http://www.keepalleytrash.com" class="cta-button cta-secondary">Visit Website</a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <h3>Keep Alley Trash</h3>
            <p>Fighting for practical waste solutions that serve our community.</p>
            <div style="border-top: 1px solid #374151; padding-top: 20px; margin-top: 20px;">
              <p style="font-size: 0.875rem; color: #9ca3af; margin-bottom: 10px;">
                This newsletter is sent to subscribers of Keep Alley Trash.
              </p>
              <p style="font-size: 0.875rem; color: #9ca3af; margin-bottom: 10px;">
                📧 <strong>To unsubscribe:</strong> Reply to this email with "UNSUBSCRIBE" in the subject line, 
                or click <a href="mailto:${process.env.ZOHO_EMAIL_USER}?subject=UNSUBSCRIBE" style="color: #3b82f6;">here</a>.
              </p>
              <p style="font-size: 0.875rem; color: #9ca3af;">
                📍 <strong>Address:</strong> Dallas, TX | 🌐 <strong>Website:</strong> <a href="http://www.keepalleytrash.com" style="color: #3b82f6;">www.keepalleytrash.com</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generatePDF() {
    // For now, return a simple text representation
    // PDF generation requires puppeteer which has installation issues
    const html = await this.generateNewsletterHTML();
    return Buffer.from('PDF generation temporarily disabled. Use HTML preview instead.', 'utf8');
  }

  async getSubscribers() {
    if (process.env.NODE_ENV === 'production') {
      const result = await supabaseHelpers.getNewsletterSubscribers();
      return result.data || [];
    } else {
      // For development, get subscribers from SQLite database
      return new Promise((resolve, reject) => {
        const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./keepalleytrash.db');
        
        db.all("SELECT email, subscribed_at as created_at FROM newsletter_subscribers WHERE is_active = 1", (err, rows) => {
          db.close();
          if (err) {
            console.error('Error getting subscribers from database:', err);
            reject(err);
          } else {
            console.log(`Found ${rows.length} subscribers in database`);
            resolve(rows || []);
          }
        });
      });
    }
  }

  async sendNewsletter(personalNote = '', selectedSubscribers = []) {
    try {
      let subscribers;
      
      if (selectedSubscribers && selectedSubscribers.length > 0) {
        // Use selected subscribers
        subscribers = selectedSubscribers.map(email => ({ email }));
        console.log(`Sending newsletter to ${subscribers.length} selected subscribers:`, selectedSubscribers);
      } else {
        // Get all subscribers
        subscribers = await this.getSubscribers();
        console.log(`Sending newsletter to ${subscribers.length} subscribers from database...`);
      }
      
      // Generate HTML content
      const htmlContent = await this.generateNewsletterHTML();
      
      // Add personal note if provided
      let finalHtml = htmlContent;
      if (personalNote && personalNote.trim()) {
        const personalNoteHtml = `
          <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <h4 style="color: #28a745; margin: 0 0 10px 0;">Personal Note from Keep Alley Trash Team:</h4>
            <p style="margin: 0; color: #495057; font-style: italic;">${personalNote}</p>
          </div>
        `;
        
        // Insert personal note after the header section
        const headerEndIndex = finalHtml.indexOf('</div>', finalHtml.indexOf('<div class="header">'));
        if (headerEndIndex !== -1) {
          finalHtml = finalHtml.slice(0, headerEndIndex + 6) + personalNoteHtml + finalHtml.slice(headerEndIndex + 6);
        }
      }
      
      const mailOptions = {
        from: {
          name: 'Keep Alley Trash Team',
          address: process.env.ZOHO_EMAIL_USER
        },
        replyTo: process.env.ZOHO_EMAIL_USER,
        subject: 'Keep Alley Trash - Community Update',
        // Add headers to improve deliverability
        headers: {
          'List-Unsubscribe': `<mailto:${process.env.ZOHO_EMAIL_USER}?subject=UNSUBSCRIBE>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Precedence': 'bulk',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
          'X-Mailer': 'Keep Alley Trash Newsletter System'
        },
        text: `
          Keep Alley Trash Community Update
          
          The city plans to end alley pickup for 26,000 homes by Jan 2026, despite public concern.
          
          Visit www.keepalleytrash.com for the latest updates and to take action.
          
          ${personalNote ? `\nPersonal Note: ${personalNote}\n` : ''}
          
          To unsubscribe, reply with "UNSUBSCRIBE" in the subject line.
        `,
        html: finalHtml
      };

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < subscribers.length; i++) {
        const subscriber = subscribers[i];
        try {
          mailOptions.to = subscriber.email;
          await this.transporter.sendMail(mailOptions);
          console.log(`✅ Newsletter sent to ${subscriber.email} (${i + 1}/${subscribers.length})`);
          successCount++;
          
          // Add delay between emails to avoid rate limiting (100ms delay)
          if (i < subscribers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`❌ Failed to send to ${subscriber.email}:`, error.message);
          errorCount++;
          
          // If we hit a rate limit, wait longer
          if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
            console.log('⏳ Rate limit detected, waiting 5 seconds...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
      }
      
      console.log(`Newsletter distribution complete! Success: ${successCount}, Errors: ${errorCount}`);
      
      return {
        success: true,
        totalSubscribers: subscribers.length,
        successCount,
        errorCount
      };
    } catch (error) {
      console.error('Error sending newsletter:', error);
      throw error;
    }
  }

  async savePDFToFile(filename = 'newsletter.pdf') {
    const pdf = await this.generatePDF();
    await fs.writeFile(filename, pdf);
    console.log(`PDF saved as ${filename}`);
    return filename;
  }
}

module.exports = NewsletterGenerator; 