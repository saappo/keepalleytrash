const NewsletterGenerator = require('./newsletter-generator');

async function testSmallBatch() {
  // Test with just 1-2 emails to avoid triggering Zoho's protection
  const testEmails = ['your-test-email@example.com']; // Change this to your email
  
  console.log('📧 Small Batch Newsletter Test');
  console.log('===============================\n');

  if (!process.env.ZOHO_EMAIL_USER || !process.env.ZOHO_EMAIL_PASSWORD) {
    console.log('❌ Email credentials not found in .env file');
    return;
  }

  try {
    console.log('✅ Email credentials found');
    console.log(`📧 Sending test newsletter to: ${testEmails.join(', ')}`);
    console.log('⏳ Using conservative sending rate (2 second delays)...');
    console.log('');

    const generator = new NewsletterGenerator();
    
    const result = await generator.sendNewsletter(
      'This is a small batch test to avoid Zoho anti-spam protection.', 
      testEmails
    );
    
    console.log('✅ Newsletter sent successfully!');
    console.log(`📊 Results: ${result.successCount} sent, ${result.errorCount} errors`);
    
    if (result.successCount > 0) {
      console.log('\n🎉 Success! Your email configuration is working.');
      console.log('💡 For larger lists, consider:');
      console.log('   1. Sending in smaller batches');
      console.log('   2. Using a different email service (Gmail, SendGrid)');
      console.log('   3. Warming up your Zoho account gradually');
    }
    
  } catch (error) {
    console.error('❌ Error sending newsletter:', error.message);
    
    if (error.message.includes('Unusual sending activity')) {
      console.log('\n🔧 Zoho blocked the sending. To fix this:');
      console.log('1. Visit: https://mail.zoho.com/UnblockMe');
      console.log('2. Log in and unblock your account');
      console.log('3. Wait 24 hours before trying again');
      console.log('4. Start with smaller batches (1-2 emails)');
    }
  }
}

// Run the test
testSmallBatch(); 