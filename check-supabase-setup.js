const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase Database Setup');
  console.log('===================================\n');

  // Check if Supabase credentials are available
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Supabase credentials not found!');
    console.log('');
    console.log('Required environment variables:');
    console.log('SUPABASE_URL=your_supabase_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
    return;
  }

  console.log('✅ Supabase credentials found');
  
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if users table exists
    console.log('\n1. Checking if "users" table exists...');
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('❌ "users" table not found or not accessible');
      console.log('Error:', usersError.message);
      console.log('');
      console.log('🔧 To fix this, create the users table in Supabase:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Run this SQL:');
      console.log(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          neighborhood VARCHAR(255),
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      return;
    }

    console.log('✅ "users" table exists');

    // Check table structure
    console.log('\n2. Checking table structure...');
    const { data: columns, error: columnsError } = await supabaseAdmin
      .rpc('get_table_columns', { table_name: 'users' });

    if (columnsError) {
      // Fallback: try to describe the table structure by checking a few records
      console.log('⚠️  Could not get column info, checking sample data...');
      const { data: sampleUser, error: sampleError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Error accessing users table:', sampleError.message);
        return;
      }

      if (sampleUser && sampleUser.length > 0) {
        const user = sampleUser[0];
        console.log('✅ Table structure looks good');
        console.log('   Available columns:', Object.keys(user).join(', '));
      }
    } else {
      console.log('✅ Table structure verified');
      console.log('   Columns:', columns.map(col => col.column_name).join(', '));
    }

    // Check for existing users
    console.log('\n3. Checking existing users...');
    const { data: allUsers, error: allUsersError } = await supabaseAdmin
      .from('users')
      .select('username, email, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (allUsersError) {
      console.log('❌ Error fetching users:', allUsersError.message);
      return;
    }

    console.log(`✅ Found ${allUsers.length} users in database`);
    
    if (allUsers.length > 0) {
      console.log('\n📋 User list:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.username} (${user.email}) - Admin: ${user.is_admin ? 'Yes' : 'No'}`);
      });
    }

    // Check for admin users specifically
    const adminUsers = allUsers.filter(user => user.is_admin);
    console.log(`\n👑 Admin users: ${adminUsers.length}`);
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found!');
      console.log('   Run: node create-supabase-admin.js');
    } else {
      console.log('✅ Admin users found');
    }

    console.log('\n🎉 Supabase setup check complete!');
    
  } catch (error) {
    console.error('❌ Error checking Supabase setup:', error.message);
  }
}

// Run the check
checkSupabaseSetup(); 