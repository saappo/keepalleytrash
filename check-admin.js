const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Connect to the database
const db = new sqlite3.Database('./keepalleytrash.db');

console.log('Checking admin user in database...');

// Check if admin user exists
db.get("SELECT * FROM users WHERE is_admin = 1", (err, row) => {
  if (err) {
    console.error('Error checking for admin user:', err);
    db.close();
    return;
  }
  
  if (row) {
    console.log('✅ Admin user found:');
    console.log('   Username:', row.username);
    console.log('   Email:', row.email);
    console.log('   Is Admin:', row.is_admin);
    console.log('\nLogin credentials:');
    console.log('   Email: admin@keepalleytrash.com');
    console.log('   Password: admin123');
  } else {
    console.log('❌ No admin user found. Creating one...');
    
    const adminPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT INTO users (username, email, password_hash, is_admin) 
            VALUES (?, ?, ?, ?)`, 
            ['admin', 'admin@keepalleytrash.com', adminPassword, 1], (err) => {
      if (err) {
        console.error('❌ Error creating admin user:', err);
      } else {
        console.log('✅ Admin user created successfully!');
        console.log('\nLogin credentials:');
        console.log('   Email: admin@keepalleytrash.com');
        console.log('   Password: admin123');
      }
      db.close();
    });
  }
}); 