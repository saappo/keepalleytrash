# Supabase Setup Guide

This guide will help you set up Supabase for your Keep Alley Trash application.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `keepalleytrash`
   - Database Password: (create a strong password)
   - Region: (choose closest to your users)
5. Click "Create new project"

## 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`)

## 3. Set Up Environment Variables

1. Create a `.env` file in your project root
2. Add your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
SECRET_KEY=your_secret_key_here
NODE_ENV=development
PORT=3000
```

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL in the editor
4. This will create all necessary tables and security policies

## 5. Configure Authentication

1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Configure your site URL (e.g., `http://localhost:3000` for development)
3. Add any additional redirect URLs you need

## 6. Test the Connection

1. Start your application: `npm start`
2. Check the console for any Supabase connection errors
3. Try registering a new user to test the integration

## 7. Create Admin User

After setting up the schema, you can create an admin user:

1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add user"
3. Enter admin details:
   - Email: `admin@keepalleytrash.com`
   - Password: `admin123`
4. After creating the user, go to **SQL Editor** and run:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@keepalleytrash.com');
```

## 8. Update Your Application Code

The application is already set up to use Supabase. The main files you'll need to modify are:

- `server.js` - Update database operations to use Supabase
- `supabase-client.js` - Already created for you
- Any route handlers that interact with the database

## Troubleshooting

### Common Issues:

1. **"Supabase credentials not found" warning**
   - Make sure your `.env` file exists and has the correct credentials
   - Restart your application after adding the `.env` file

2. **Database connection errors**
   - Verify your Supabase URL and keys are correct
   - Check that your database schema has been created

3. **Authentication issues**
   - Ensure your site URL is configured in Supabase Auth settings
   - Check that RLS policies are set up correctly

### Getting Help:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check the console logs for detailed error messages

## Next Steps

After completing this setup:

1. Test user registration and login
2. Test creating posts and suggestions
3. Test admin functionality
4. Deploy to production with proper environment variables 