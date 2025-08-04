const sqlite3 = require('sqlite3').verbose();

// Connect to the database
const db = new sqlite3.Database('./keepalleytrash.db');

console.log('Checking database structure...');

// Check what tables exist
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err);
    db.close();
    return;
  }
  
  console.log('Tables in database:');
  tables.forEach(table => {
    console.log('  -', table.name);
  });
  
  // Check newsletter_subscribers table structure
  db.all("PRAGMA table_info(newsletter_subscribers)", (err, columns) => {
    if (err) {
      console.error('Error getting newsletter_subscribers table info:', err);
    } else {
      console.log('\nnewsletter_subscribers table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
    }
    
    // Check if there are any subscribers
    db.all("SELECT * FROM newsletter_subscribers LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting subscribers:', err);
      } else {
        console.log('\nSample subscribers:');
        rows.forEach(row => {
          console.log('  -', row);
        });
      }
      db.close();
    });
  });
}); 