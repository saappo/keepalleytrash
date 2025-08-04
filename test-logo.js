const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Logo Configuration');
console.log('=============================\n');

// Check if logo file exists in public directory
const publicLogoPath = path.join(__dirname, 'public', 'powered_by_saappo.png');
const staticLogoPath = path.join(__dirname, 'static', 'images', 'saappo-logo.png');

console.log('1. Checking logo files:');
console.log(`   Public logo: ${fs.existsSync(publicLogoPath) ? '✅ Exists' : '❌ Missing'}`);
console.log(`   Static logo: ${fs.existsSync(staticLogoPath) ? '✅ Exists' : '❌ Missing'}`);

// Check file sizes
if (fs.existsSync(publicLogoPath)) {
  const stats = fs.statSync(publicLogoPath);
  console.log(`   Public logo size: ${(stats.size / 1024).toFixed(1)} KB`);
}

if (fs.existsSync(staticLogoPath)) {
  const stats = fs.statSync(staticLogoPath);
  console.log(`   Static logo size: ${(stats.size / 1024).toFixed(1)} KB`);
}

// Check Vercel configuration
console.log('\n2. Checking Vercel configuration:');
const vercelConfig = fs.readFileSync('vercel.json', 'utf8');
if (vercelConfig.includes('powered_by_saappo.png')) {
  console.log('   ✅ Logo route configured in vercel.json');
} else {
  console.log('   ❌ Logo route missing from vercel.json');
}

// Check layout file
console.log('\n3. Checking layout file:');
const layoutFile = fs.readFileSync('views/layouts/main.handlebars', 'utf8');
if (layoutFile.includes('powered_by_saappo.png')) {
  console.log('   ✅ Logo referenced in layout file');
  console.log('   Path: /powered_by_saappo.png');
} else {
  console.log('   ❌ Logo not found in layout file');
}

console.log('\n4. Recommendations:');
console.log('   - The logo should be accessible at: https://your-site.vercel.app/powered_by_saappo.png');
console.log('   - If still broken, try accessing the direct URL in your browser');
console.log('   - Make sure the file is properly committed and deployed to Vercel');

console.log('\n🎉 Logo test complete!'); 