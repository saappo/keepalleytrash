// Supabase Configuration
// Copy this file to .env and fill in your actual Supabase credentials

module.exports = {
  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL || 'your_supabase_project_url',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_supabase_service_role_key',
  
  // Application Configuration
  SECRET_KEY: process.env.SECRET_KEY || 'dev-secret-key-change-in-production',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // Email Configuration (if using nodemailer)
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || 'your_email@gmail.com',
  EMAIL_PASS: process.env.EMAIL_PASS || 'your_email_password'
}; 