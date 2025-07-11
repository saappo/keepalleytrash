# Keep Alley Trash

A community-driven platform to maintain clean and safe neighborhoods by connecting neighbors and organizing alley cleanup initiatives.

## Features
- Community message board
- Alley cleanup event organization
- Neighborhood guidelines and best practices
- User profiles and neighborhood groups
- Report and track alley conditions
- Admin dashboard for community management
- Email notifications and contact forms

## Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Template Engine**: Handlebars
- **Frontend**: Bootstrap 5, Font Awesome
- **Authentication**: Session-based with bcrypt
- **Email**: Nodemailer
- **Deployment**: Vercel

## Local Development Setup

1. Install Node.js (version 18 or higher):
   - Download from [nodejs.org](https://nodejs.org/)

2. Clone the repository:
```bash
git clone <your-repo-url>
cd keepalleytrash
```

3. Install dependencies:
```bash
npm install
```

4. Create a `.env` file in the root directory:
```env
SECRET_KEY=your-secret-key-here
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
NODE_ENV=development
```

5. Run the development server:
```bash
npm run dev
```

6. Visit http://localhost:3000 in your web browser

## Production Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Follow the prompts to configure your deployment

### Deploy to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a new repository on GitHub

3. Push to GitHub:
```bash
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

4. Connect your GitHub repository to Vercel for automatic deployments

## Project Structure
- `server.js` - Main application file
- `package.json` - Dependencies and scripts
- `views/` - Handlebars templates
- `static/` - CSS, JavaScript, and image files
- `vercel.json` - Vercel deployment configuration

## Database Schema
- **Users**: username, email, password_hash, neighborhood, is_admin
- **Posts**: title, content, category, user_id, created_at
- **Suggestions**: title, description, category, status, user_id, created_at
- **Contacts**: name, email, subject, message, created_at
- **Subscribers**: email, subscribed_at

## Admin Access
Default admin credentials:
- Email: admin@keepalleytrash.com
- Password: SecureAdmin2025!

**Important**: These credentials have been updated for security. Keep them safe!

## Environment Variables
- `SECRET_KEY`: Session secret key
- `MAIL_USERNAME`: Gmail username for email notifications
- `MAIL_PASSWORD`: Gmail app password
- `NODE_ENV`: Environment (development/production)

## Contributing
This is a community project. Feel free to submit issues and pull requests.

## License
MIT License 