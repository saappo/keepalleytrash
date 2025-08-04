const bcrypt = require('bcryptjs');
const supabaseHelpers = require('./supabase-client');

async function createSupabaseAdmin() {
  console.log('🔧 Creating Admin User in Supabase');
  console.log('==================================\n');

  // Check if Supabase credentials are available
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Supabase credentials not found!');
    console.log('');
    console.log('To fix this, add these to your .env file:');
    console.log('SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
    console.log('');
    console.log('You can find these in your Supabase project dashboard.');
    return;
  }

  try {
    // Check if admin user already exists
    console.log('🔍 Checking if admin user already exists...');
    const existingUser = await supabaseHelpers.getUserByEmail('admin@keepalleytrash.com');
    
    if (existingUser.success) {
      console.log('✅ Admin user already exists in Supabase!');
      console.log('   Username:', existingUser.data.username);
      console.log('   Email:', existingUser.data.email);
      console.log('   Is Admin:', existingUser.data.is_admin);
      console.log('');
      console.log('📧 Login credentials for deployed site:');
      console.log('   Email: admin@keepalleytrash.com');
      console.log('   Password: admin123');
      return;
    }

    // Create admin user
    console.log('👤 Creating new admin user...');
    const adminPassword = bcrypt.hashSync('admin123', 10);
    
    const result = await supabaseHelpers.createUser(
      'admin',
      'admin@keepalleytrash.com',
      adminPassword,
      'Dallas'
    );

    if (!result.success) {
      console.log('❌ Failed to create admin user:', result.error);
      return;
    }

    // Update the user to be an admin
    console.log('🔧 Updating user to admin status...');
    const { createClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_admin: true })
      .eq('email', 'admin@keepalleytrash.com');

    if (updateError) {
      console.log('❌ Failed to update admin status:', updateError.message);
      return;
    }

    console.log('✅ Admin user created successfully in Supabase!');
    console.log('');
    console.log('📧 Login credentials for deployed site:');
    console.log('   Email: admin@keepalleytrash.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('🌐 You can now log in to your deployed site at:');
    console.log('   https://your-deployed-site.vercel.app/login');
    
  } catch (error) {
    console.error('❌ Error creating Supabase admin:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Make sure your Supabase credentials are correct');
    console.log('2. Check that the "users" table exists in Supabase');
    console.log('3. Verify the table has the correct columns (username, email, password_hash, is_admin)');
  }
}

// Run the script
createSupabaseAdmin(); 