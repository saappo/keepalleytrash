const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
}

// Client for user operations (uses anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (uses service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions for your specific tables
const supabaseHelpers = {
  // Contact form submissions (no login required)
  // Table: KATcontactUSonly - for quick messages to organization
  async submitContact(name, email, subject, message) {
    try {
      const { data, error } = await supabase
        .from('KATcontactUSonly')
        .insert([
          {
            name: name,
            email: email,
            subject: subject,
            message: message
          }
        ]);
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting contact form:', error);
      return { success: false, error: error.message };
    }
  },

  // Newsletter subscriptions (no login required)
  // Table: KATnewsletter - for email list signups
  async subscribeToNewsletter(email) {
    try {
      const { data, error } = await supabase
        .from('KATnewsletter')
        .insert([
          {
            email: email
            // created_at will be set automatically by the database
          }
        ]);
      
      if (error) {
        // If it's a duplicate key error, that's okay
        if (error.code === '23505') { // PostgreSQL unique constraint violation
          return { success: true, message: 'Email already subscribed' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all newsletter subscribers (admin only)
  // Table: KATnewsletter
  async getNewsletterSubscribers() {
    try {
      const { data, error } = await supabaseAdmin
        .from('KATnewsletter')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching newsletter subscribers:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all contact submissions (admin only)
  // Table: KATcontactUSonly
  async getContactSubmissions() {
    try {
      const { data, error } = await supabaseAdmin
        .from('KATcontactUSonly')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching contact submissions:', error);
      return { success: false, error: error.message };
    }
  },

  // User authentication functions (for production)
  // Table: users (needs to be created in Supabase)
  async createUser(username, email, passwordHash, neighborhood) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            username: username,
            email: email,
            password_hash: passwordHash,
            neighborhood: neighborhood,
            is_admin: false,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          return { success: false, error: 'Username or email already exists' };
        }
        throw error;
      }
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  async getUserByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return { success: false, error: 'User not found' };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return { success: false, error: error.message };
    }
  },

  async getPosts() {
    try {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          users(username)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { success: false, error: error.message };
    }
  },

  async createPost(title, content, category, userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .insert([
          {
            title: title,
            content: content,
            category: category,
            user_id: userId,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseHelpers
}; 