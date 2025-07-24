const NewsletterGenerator = require('./newsletter-generator');
const fs = require('fs').promises;

async function testNewsletterHTML() {
  try {
    console.log('Generating newsletter HTML...');
    
    const generator = new NewsletterGenerator();
    
    // Generate HTML for preview
    console.log('Creating HTML newsletter...');
    const html = await generator.generateNewsletterHTML();
    
    // Save HTML for preview
    await fs.writeFile('newsletter-preview.html', html);
    console.log('✅ Newsletter HTML generated successfully!');
    console.log('📄 Check newsletter-preview.html in your project directory');
    console.log('🌐 Open it in your browser to see the newsletter!');
    
  } catch (error) {
    console.error('❌ Error generating newsletter HTML:', error);
  }
}

// Run the test
testNewsletterHTML(); 