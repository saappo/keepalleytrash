# Supabase Setup for KeepAlleyTrash

This guide is specifically for your existing Supabase project "KeepAlleyTrash" with tables `KATcontacts` and `KATnewsletter`.

## ✅ What's Already Done

1. **Supabase Client Installed** - `@supabase/supabase-js` is installed
2. **Client Configuration** - `supabase-client.js` is set up for your tables
3. **Route Integration** - Contact and newsletter routes now use Supabase
4. **Helper Functions** - Ready-to-use functions for your specific tables

## 🔧 Setup Steps

### 1. Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your "KeepAlleyTrash" project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)
   - **Service role key** (starts with `eyJ...`)

### 2. Create Environment File

Create a `.env` file in your project root with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Configuration
SECRET_KEY=your_secret_key_here
NODE_ENV=development
PORT=3000

# Email Configuration (optional)
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_email_password
```

### 3. Verify Your Table Structure

Your Supabase tables should have these columns:

**KATcontacts table:**
- `id` (UUID, primary key)
- `name` (text)
- `email` (text)
- `subject` (text)
- `message` (text)
- `created_at` (timestamp with time zone)

**KATnewsletter table:**
- `id` (UUID, primary key)
- `email` (text, unique)
- `subscribed_at` (timestamp with time zone)

### 4. Test the Integration

1. Start your application: `npm start`
2. Test the contact form at `/contact`
3. Test the newsletter subscription at `/subscribe`
4. Check your Supabase dashboard to see the data

## 🔍 How It Works

### Contact Form (`/contact`)
- Data goes to your `KATcontacts` table
- Still sends email notification if configured
- Error handling for failed submissions

### Newsletter Subscription (`/subscribe`)
- Data goes to your `KATnewsletter` table
- Handles duplicate emails gracefully
- Shows success/error messages

### User Registration
- Users are automatically subscribed to newsletter
- Newsletter subscription happens via Supabase
- Registration still works if Supabase is down

## 🛠️ Troubleshooting

### "Supabase credentials not found" warning
- Make sure your `.env` file exists and has the correct credentials
- Restart your application after adding the `.env` file

### Database connection errors
- Verify your Supabase URL and keys are correct
- Check that your table names match exactly: `KATcontacts` and `KATnewsletter`

### Table structure issues
- Make sure your tables have the required columns
- Check that email field in `KATnewsletter` has a unique constraint

## 📊 Viewing Data

You can view your data in the Supabase dashboard:
1. Go to **Table Editor**
2. Select `KATcontacts` or `KATnewsletter`
3. See all submissions in real-time

## 🚀 Next Steps

1. **Test thoroughly** - Try all forms and check data appears in Supabase
2. **Set up email notifications** - Configure your email credentials
3. **Deploy to production** - Update environment variables in your hosting platform
4. **Monitor usage** - Check Supabase dashboard for data and performance

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your Supabase credentials are correct
3. Ensure your table structure matches the expected format
4. Check the Supabase dashboard for any database errors 