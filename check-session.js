const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('./keepalleytrash.db');

console.log('Checking admin user session data...');

// Check admin user details
db.get("SELECT id, username, email, is_admin FROM users WHERE is_admin = 1", (err, row) => {
  if (err) {
    console.error('Error checking admin user:', err);
    db.close();
    return;
  }
  
  if (row) {
    console.log('✅ Admin user found:');
    console.log('   ID:', row.id);
    console.log('   Username:', row.username);
    console.log('   Email:', row.email);
    console.log('   Is Admin:', row.is_admin);
    console.log('\nExpected session data after login:');
    console.log('   req.session.userId:', row.id);
    console.log('   req.session.isAdmin:', row.is_admin);
    console.log('   req.session.user.isAdmin:', row.is_admin);
  } else {
    console.log('❌ No admin user found');
  }
  db.close();
}); 