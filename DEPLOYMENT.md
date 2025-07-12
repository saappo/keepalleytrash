# Deployment Guide - Keep Alley Trash

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory:**
   ```bash
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `keepalleytrash` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: `N`

5. **Your site will be deployed!** Vercel will provide you with a URL.

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Keep Alley Trash Node.js app"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/keepalleytrash.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it's a Node.js app
   - Click "Deploy"

## 🔧 Environment Variables Setup

### For Local Development:
Create a `.env` file in your project root:
```env
SECRET_KEY=your-super-secret-key-here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
NODE_ENV=development
```

### For Vercel Production:
1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:
   - `SECRET_KEY`: A long, random string for session security
   - `MAIL_USERNAME`: Your Gmail address (optional)
   - `MAIL_PASSWORD`: Your Gmail app password (optional)
   - `NODE_ENV`: `production`

## 📝 GitHub Repository Setup

### Create a New Repository:
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `keepalleytrash`
4. Make it public or private (your choice)
5. Don't initialize with README (we already have one)

### Push Your Code:
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Keep Alley Trash community platform"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/keepalleytrash.git

# Push to main branch
git branch -M main
git push -u origin main
```

## 🌐 Custom Domain (Optional)

### Add Custom Domain in Vercel:
1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## 🔄 Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy when you push to the `main` branch
- Create preview deployments for pull requests
- Roll back to previous versions if needed

## 📊 Monitoring Your Deployment

### Vercel Dashboard Features:
- **Analytics**: Track page views and performance
- **Functions**: Monitor serverless function performance
- **Logs**: View real-time application logs
- **Deployments**: Track all deployment history

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check that all dependencies are in `package.json`
   - Ensure `server.js` is the main entry point
   - Verify `vercel.json` configuration

2. **Environment Variables Not Working:**
   - Make sure they're set in Vercel dashboard
   - Redeploy after adding new variables
   - Check variable names match your code

3. **Database Issues:**
   - SQLite database is created automatically
   - Admin user is created on first run
   - Database file is included in deployment

### Admin Access:
- **Email:** admin@keepalleytrash.com
- **Password:** SecureAdmin2025!
- **These credentials have been updated for security!**

## 🎉 Success!

Your Keep Alley Trash community platform is now live and ready to help neighborhoods organize and advocate for alley collection services!

### Next Steps:
1. Share your deployed URL with your community
2. Encourage neighbors to register and join
3. Start posting about local alley collection issues
4. Use the platform to organize community meetings and advocacy efforts

---

**Need Help?** Check out:
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Guides](https://guides.github.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

# Vercel Deployment Guide

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### Required Variables
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SECRET_KEY=your_random_secret_key_for_sessions
```

### Optional Email Variables (for contact form notifications)
```
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## How to Set Environment Variables on Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the appropriate value
5. Redeploy your project

## Current Setup

- **Development**: Uses SQLite for local development
- **Production**: Uses Supabase for data storage (contact form, newsletter)
- **Sessions**: Memory-based in production (SQLite sessions don't work on Vercel)

## Data Storage

- **Contact Form Submissions**: Stored in Supabase table `KATcontactUSonly`
- **Newsletter Subscriptions**: Stored in Supabase table `KATnewsletter`
- **Users/Posts**: Currently SQLite only (development mode)

## Troubleshooting

If you see a 500 error:
1. Check that all required environment variables are set
2. Verify your Supabase credentials are correct
3. Check Vercel function logs for specific error messages

## Next Steps

To fully migrate to Supabase:
1. Create user and post tables in Supabase
2. Update authentication to use Supabase Auth
3. Migrate existing SQLite data to Supabase 