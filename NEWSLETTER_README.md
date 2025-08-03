# Newsletter System for Keep Alley Trash

This newsletter system allows you to create, preview, and send professional PDF newsletters to your subscribers.

## Features

- **PDF Generation**: Automatically creates beautiful PDF newsletters
- **Email Distribution**: Sends newsletters to all subscribers
- **Admin Interface**: Easy-to-use dashboard for newsletter management
- **Preview System**: Preview newsletters before sending
- **Subscriber Management**: View and manage your subscriber list

## Setup

### 1. Install Dependencies

The required packages are already installed:
- `puppeteer` - For PDF generation
- `nodemailer` - For email sending
- `handlebars` - For template rendering

### 2. Email Configuration

To send newsletters, you need to configure Zoho email settings. Add these environment variables to your `.env` file:

```env
ZOHO_EMAIL_USER=your-email@zoho.com
ZOHO_EMAIL_PASSWORD=your-zoho-app-password
```

**For Zoho users:**
1. Log into your Zoho account
2. Go to Settings → Mail Accounts
3. Enable SMTP access
4. Generate an "App Password" for your email account
5. Use the app password as `ZOHO_EMAIL_PASSWORD`

### 3. Test the System

Run the test script to generate a sample newsletter:

```bash
node test-newsletter.js
```

This will create:
- `test-newsletter.pdf` - The PDF newsletter
- `test-newsletter.html` - HTML preview

## Usage

### Admin Dashboard

1. Log in as an admin user
2. Go to `/admin/dashboard`
3. Click "Newsletter Management"

### Newsletter Management Interface

The admin interface provides:

1. **Preview Newsletter** - See how the newsletter will look
2. **Download PDF** - Generate and download the PDF
3. **Send Newsletter** - Send to all subscribers
4. **Subscriber List** - View and manage subscribers

### Newsletter Content

The newsletter includes:

- **Header** - Keep Alley Trash branding and current date
- **Alert** - Key message about the alley pickup changes
- **Council Member Report Card** - Status of each district representative
- **Missing Quotes Section** - Transparency issues
- **City Consensus Issues** - Problems with the current approach
- **Action Items** - What subscribers can do
- **Call to Action** - Links to petition and website
- **Footer** - Contact information and unsubscribe instructions

## Customization

### Modifying Newsletter Content

Edit `newsletter-generator.js` to customize:

- **Council member data** - Update status and quotes
- **Action items** - Change call-to-action items
- **Styling** - Modify colors, fonts, and layout
- **Content** - Update messages and information

### Adding New Sections

To add new sections to the newsletter:

1. Modify the `generateNewsletterHTML()` method in `newsletter-generator.js`
2. Add your HTML content to the template
3. Update the styling as needed

## Email Templates

The system uses HTML email templates that are:
- **Responsive** - Work on mobile and desktop
- **Professional** - Clean, modern design
- **Accessible** - Good contrast and readable fonts
- **Compatible** - Work with major email clients

## Subscriber Management

### Viewing Subscribers

- Go to `/admin/newsletter`
- See the full list of subscribers
- View subscription dates

### Removing Subscribers

- Click "Remove" next to any subscriber
- Confirm the action
- Subscriber will be removed from the list

## Troubleshooting

### PDF Generation Issues

If PDF generation fails:

1. **Check Puppeteer installation**:
   ```bash
   npm install puppeteer
   ```

2. **Memory issues**: The system uses headless Chrome, which requires some memory

3. **Font issues**: The system uses web-safe fonts for compatibility

### Email Sending Issues

If emails aren't sending:

1. **Check email credentials**:
   - Verify `EMAIL_USER` and `EMAIL_PASSWORD` are set
   - For Gmail, ensure you're using an App Password

2. **Check email limits**:
   - Gmail has daily sending limits
   - Consider using a service like SendGrid for large lists

3. **Check spam filters**:
   - Some emails might go to spam
   - Consider using a professional email service

### Development vs Production

- **Development**: Uses sample data and local file generation
- **Production**: Uses real subscriber data from Supabase

## Security

- Only admin users can access newsletter management
- Email credentials are stored as environment variables
- Subscriber data is protected by authentication

## Future Enhancements

Potential improvements:

1. **Scheduled sending** - Send newsletters at specific times
2. **A/B testing** - Test different newsletter versions
3. **Analytics** - Track open rates and click-through rates
4. **Templates** - Multiple newsletter templates
5. **Segmentation** - Send to specific subscriber groups

## Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify all environment variables are set
3. Test with the `test-newsletter.js` script
4. Check that all dependencies are installed

The newsletter system is designed to be robust and user-friendly while maintaining the professional appearance of your Keep Alley Trash brand. 