const NewsletterGenerator = require('./newsletter-generator');
const fs = require('fs').promises;

async function debugNewsletter() {
  console.log('🔍 Newsletter Debug Tool');
  console.log('========================\n');

  // Check environment variables
  console.log('1. Checking Environment Variables:');
  console.log('   ZOHO_EMAIL_USER:', process.env.ZOHO_EMAIL_USER ? '✅ Set' : '❌ Missing');
  console.log('   ZOHO_EMAIL_PASSWORD:', process.env.ZOHO_EMAIL_PASSWORD ? '✅ Set' : '❌ Missing');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');

  // Test newsletter generation
  try {
    console.log('2. Testing Newsletter Generation:');
    const generator = new NewsletterGenerator();
    
    // Test HTML generation
    console.log('   Generating HTML...');
    const html = await generator.generateNewsletterHTML();
    console.log('   ✅ HTML generated successfully');
    
    // Save HTML for preview
    await fs.writeFile('debug-newsletter.html', html);
    console.log('   📄 HTML saved as debug-newsletter.html');
    
    // Test subscriber retrieval
    console.log('3. Testing Subscriber Retrieval:');
    const subscribers = await generator.getSubscribers();
    console.log(`   ✅ Found ${subscribers.length} subscribers`);
    
    if (subscribers.length > 0) {
      console.log('   Sample subscribers:');
      subscribers.slice(0, 3).forEach((sub, i) => {
        console.log(`     ${i + 1}. ${sub.email}`);
      });
    }
    
    // Test email configuration
    console.log('4. Testing Email Configuration:');
    if (process.env.ZOHO_EMAIL_USER && process.env.ZOHO_EMAIL_PASSWORD) {
      console.log('   ✅ Email credentials are set');
      console.log('   📧 Ready to send emails');
    } else {
      console.log('   ❌ Email credentials are missing');
      console.log('   📧 Cannot send emails without ZOHO_EMAIL_USER and ZOHO_EMAIL_PASSWORD');
    }
    
    console.log('\n🎉 Debug complete!');
    console.log('\nNext steps:');
    if (!process.env.ZOHO_EMAIL_USER || !process.env.ZOHO_EMAIL_PASSWORD) {
      console.log('1. Create a .env file with your email credentials');
      console.log('2. Set ZOHO_EMAIL_USER and ZOHO_EMAIL_PASSWORD');
      console.log('3. Restart your application');
    } else {
      console.log('1. Open debug-newsletter.html in your browser to preview');
      console.log('2. Run the newsletter admin interface to send emails');
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugNewsletter(); 