const NewsletterGenerator = require('./newsletter-generator');

async function testNewsletterSend() {
  // Test email address - change this to your email for testing
  const testEmail = 'your-test-email@example.com';
  
  console.log('📧 Newsletter Send Test');
  console.log('=======================\n');

  // Check if email credentials are set
  if (!process.env.ZOHO_EMAIL_USER || !process.env.ZOHO_EMAIL_PASSWORD) {
    console.log('❌ Email credentials not found!');
    console.log('');
    console.log('To fix this:');
    console.log('1. Create a .env file in your project root');
    console.log('2. Add these lines to your .env file:');
    console.log('   ZOHO_EMAIL_USER=your-email@zoho.com');
    console.log('   ZOHO_EMAIL_PASSWORD=your-zoho-app-password');
    console.log('3. Restart your terminal/application');
    console.log('');
    console.log('For Zoho setup:');
    console.log('1. Log into your Zoho account');
    console.log('2. Go to Settings → Mail Accounts');
    console.log('3. Enable SMTP access');
    console.log('4. Generate an "App Password"');
    console.log('5. Use the app password as ZOHO_EMAIL_PASSWORD');
    return;
  }

  try {
    console.log('✅ Email credentials found');
    console.log(`📧 Sending test newsletter to: ${testEmail}`);
    console.log('');

    const generator = new NewsletterGenerator();
    
    // Send to test email
    const result = await generator.sendNewsletter(
      'This is a test newsletter from your local development environment!', 
      [testEmail]
    );
    
    console.log('✅ Newsletter sent successfully!');
    console.log(`📊 Results: ${result.successCount} sent, ${result.errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error sending newsletter:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('');
      console.log('🔧 This usually means:');
      console.log('1. Email credentials are incorrect');
      console.log('2. You need to use an App Password (not your regular password)');
      console.log('3. SMTP access is not enabled for your email account');
    }
    
    if (error.message.includes('rate limit')) {
      console.log('');
      console.log('⏳ Rate limit reached. Wait a few minutes and try again.');
    }
  }
}

// Run the test
testNewsletterSend(); 