const NewsletterGenerator = require('./newsletter-generator');

async function testNewsletter() {
  try {
    console.log('Testing newsletter generation...');
    
    const generator = new NewsletterGenerator();
    
    // Generate and save PDF
    console.log('Generating PDF...');
    await generator.savePDFToFile('test-newsletter.pdf');
    
    console.log('✅ Newsletter PDF generated successfully!');
    console.log('📄 Check test-newsletter.pdf in your project directory');
    
    // Generate HTML for preview
    console.log('\nGenerating HTML preview...');
    const html = await generator.generateNewsletterHTML();
    
    // Save HTML for preview
    const fs = require('fs').promises;
    await fs.writeFile('test-newsletter.html', html);
    console.log('📄 Check test-newsletter.html for HTML preview');
    
  } catch (error) {
    console.error('❌ Error testing newsletter:', error);
  }
}

// Run the test
testNewsletter(); 