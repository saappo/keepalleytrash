const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Connect to the database
const db = new sqlite3.Database('./keepalleytrash.db');

console.log('Resetting admin password...');

// Update admin password
const newPassword = 'admin123';
const hashedPassword = bcrypt.hashSync(newPassword, 10);

db.run(`UPDATE users SET password_hash = ? WHERE is_admin = 1`, [hashedPassword], (err) => {
  if (err) {
    console.error('❌ Error updating admin password:', err);
  } else {
    console.log('✅ Admin password reset successfully!');
    console.log('\nNew login credentials:');
    console.log('   Email: admin@keepalleytrash.com');
    console.log('   Password: admin123');
  }
  db.close();
}); 