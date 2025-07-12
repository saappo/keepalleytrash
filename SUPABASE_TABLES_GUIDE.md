# Supabase Tables Guide - Keep Alley Trash

This guide explains the purpose and structure of all 3 tables in your Supabase project.

## 📋 Table Overview

### **1. KATcontactUSonly** - Contact Form Messages
**Purpose:** Quick messages from visitors to your organization (no login required)
**Used by:** `/contact` page
**Access:** Public (anyone can submit)

**Columns:**
- `id` (UUID, primary key)
- `name` (text) - Visitor's name
- `email` (text) - Visitor's email
- `subject` (text) - Message subject
- `message` (text) - Message content
- `created_at` (timestamp) - When submitted

**Example Use:** "Hi, I have a question about alley cleanup in my neighborhood"

---

### **2. KATnewsletter** - Newsletter Subscriptions
**Purpose:** Email list for newsletter subscribers (no login required)
**Used by:** `/subscribe` page + automatic on user registration
**Access:** Public (anyone can subscribe)

**Columns:**
- `id` (UUID, primary key)
- `email` (text, unique) - Subscriber's email
- `subscribed_at` (timestamp) - When subscribed

**Example Use:** "Subscribe me to your newsletter for updates"

---

### **3. KATcontacts** - User Contact Information
**Purpose:** Contact information for registered users (login required)
**Used by:** User registration system
**Access:** Private (only for registered users)

**Columns:**
- `id` (UUID, primary key)
- `name` (text) - User's name
- `email` (text) - User's email
- `userquotes` (text) - User quotes/comments
- `neighborhood` (text) - User's neighborhood
- `message` (text) - Additional user info
- `created_at` (timestamp) - When created

**Example Use:** Storing additional contact info for registered users

## 🔄 Data Flow

### **Contact Form (`/contact`)**
```
User fills form → KATcontactUSonly table → Email notification sent
```

### **Newsletter Subscription (`/subscribe`)**
```
User subscribes → KATnewsletter table → Success message shown
```

### **User Registration (`/register`)**
```
User registers → SQLite users table + KATnewsletter table (auto-subscribe)
```

## 📊 Admin Access

**To view data in Supabase Dashboard:**
1. Go to **Table Editor**
2. Select the table you want to view:
   - `KATcontactUSonly` - Contact form submissions
   - `KATnewsletter` - Newsletter subscribers
   - `KATcontacts` - User contact info

## 🛠️ Table Structure Requirements

### **KATcontactUSonly** (Required for contact form)
```sql
CREATE TABLE "KATcontactUSonly" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);
```

### **KATnewsletter** (Required for newsletter)
```sql
CREATE TABLE "KATnewsletter" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "email" text UNIQUE NOT NULL,
  "subscribed_at" timestamp with time zone DEFAULT now()
);
```

## ✅ Testing Checklist

- [ ] Contact form saves to `KATcontactUSonly`
- [ ] Newsletter subscription saves to `KATnewsletter`
- [ ] User registration auto-subscribes to `KATnewsletter`
- [ ] Email notifications work for contact form
- [ ] No duplicate newsletter subscriptions
- [ ] Admin can view all data in Supabase dashboard 