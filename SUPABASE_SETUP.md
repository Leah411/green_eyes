# Supabase Database Setup Guide - Step by Step

This guide will walk you through connecting your Django application to a Supabase PostgreSQL database.

---

## 📋 Prerequisites

- A Supabase account (free tier works fine)
- Your Django project set up locally
- Python virtual environment activated

---

## Step 1: Create a Supabase Project

### 1.1 Sign Up / Log In
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** or **"Sign In"** if you already have an account
3. Sign up with GitHub, Google, or email

### 1.2 Create New Project
1. Once logged in, click the **"New Project"** button (usually in the top right or on the dashboard)
2. Fill in the project details:
   - **Name**: Enter a name for your project (e.g., "yirok-app" or "green-eyes")
   - **Database Password**: 
     - ⚠️ **IMPORTANT**: Choose a strong password and **SAVE IT SOMEWHERE SAFE**
     - You'll need this password later - Supabase won't show it again!
     - Use a password manager or write it down securely
   - **Region**: Select the region closest to you (e.g., "West US (N. California)" or "EU West (Ireland)")
   - **Pricing Plan**: Select **"Free"** for development (gives you 500MB database, 2GB bandwidth)
3. Click **"Create new project"**
4. ⏳ **Wait 2-3 minutes** for Supabase to set up your project (you'll see a progress indicator)

---

## Step 2: Get Your Database Connection Details

### 2.1 Navigate to Database Settings
1. Once your project is ready, you'll be in the Supabase dashboard
2. Look for the **Settings** icon (⚙️ gear icon) in the left sidebar
3. Click on **Settings** → **Database** (or just click "Database" in the sidebar)

### 2.2 Find Connection Information
1. Scroll down to the **"Connection string"** section
2. You'll see a connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 2.3 Extract the Details You Need
From the connection string or the settings page, you need these 5 pieces of information:

| What You Need | Example Value | Where to Find It |
|--------------|---------------|------------------|
| **DB_HOST** | `db.abcdefghijklmnop.supabase.co` | The hostname (after `@` and before `:5432`) |
| **DB_NAME** | `postgres` | Usually always `postgres` |
| **DB_USER** | `postgres` | Usually always `postgres` |
| **DB_PASS** | `your-password-here` | The password you set in Step 1.2 |
| **DB_PORT** | `5432` | Usually always `5432` |

**Example:**
If your connection string is:
```
postgresql://postgres:MySecurePass123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

Then:
- **DB_HOST** = `db.abcdefghijklmnop.supabase.co`
- **DB_NAME** = `postgres`
- **DB_USER** = `postgres`
- **DB_PASS** = `MySecurePass123`
- **DB_PORT** = `5432`

---

## Step 3: Create or Update Your .env File

### 3.1 Locate Your .env File
1. In your project root directory (`green_eyes`), check if you have a `.env` file
2. If it doesn't exist, create a new file named `.env` (no extension, just `.env`)

### 3.2 Add Supabase Credentials
Open your `.env` file and add/update these lines with your Supabase details:

```env
# Database (Supabase)
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-actual-supabase-password-here
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=*

# Email (console backend for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**⚠️ Important:**
- Replace `your-actual-supabase-password-here` with the password you set in Step 1.2
- Replace `db.your-project-ref.supabase.co` with your actual host from Step 2.3
- Make sure there are **no spaces** around the `=` sign
- Don't use quotes around the values

**Example of a real .env file:**
```env
DB_NAME=postgres
DB_USER=postgres
DB_PASS=MySecurePass123
DB_HOST=db.abcdefghijklmnop.supabase.co
DB_PORT=5432
SECRET_KEY=django-insecure-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=*
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.3 Save the File
Save your `.env` file (make sure it's saved as `.env`, not `.env.txt`)

---

## Step 4: Activate Your Virtual Environment

Before testing the connection, make sure your Python virtual environment is activated:

### On Windows PowerShell:
```powershell
venv\Scripts\Activate.ps1
```

### On Windows Command Prompt:
```cmd
venv\Scripts\activate.bat
```

### On Mac/Linux:
```bash
source venv/bin/activate
```

You should see `(venv)` at the beginning of your command prompt when it's activated.

---

## Step 5: Test the Database Connection

### 5.1 Test Connection (Quick Check)
Run this command to verify Django can connect to Supabase:

```powershell
python manage.py check --database default
```

**Expected output if successful:**
```
System check identified no issues (0 silenced).
```

**If you see errors:**
- Check that your `.env` file has the correct values
- Make sure your virtual environment is activated
- Verify your Supabase project is running (check the Supabase dashboard)

### 5.2 Test with Migrations (Full Test)
This will actually try to connect and run database operations:

```powershell
python manage.py migrate
```

**Expected output if successful:**
```
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, core, sessions
Running migrations:
  Applying core.0001_initial... OK
  Applying core.0002_auto_20251116_0815... OK
  ...
```

**If you see connection errors:**
- Double-check your `.env` file values
- Verify your Supabase password is correct
- Make sure your internet connection is working
- Check that your Supabase project hasn't been paused (free tier projects pause after inactivity)

---

## Step 6: Initialize Your Database

Once the connection works, set up your database with initial data:

### 6.1 Run Migrations (if not done in Step 5)
```powershell
python manage.py migrate
```

### 6.2 Create a Superuser (Admin Account)
```powershell
python manage.py createsuperuser
```

You'll be prompted to enter:
- Username (e.g., `admin`)
- Email address (optional)
- Password (enter twice)

**Example:**
```
Username: admin
Email address: admin@example.com
Password: ********
Password (again): ********
Superuser created successfully.
```

### 6.3 Seed Initial Data (Optional)
This creates sample groups, units, and test users:

```powershell
python manage.py seed_data
```

**Expected output:**
```
Creating groups...
Creating units...
Creating test users...
Seed data created successfully!
```

---

## Step 7: Verify Everything Works

### 7.1 Start Your Django Server
```powershell
python manage.py runserver
```

### 7.2 Test the Connection
1. Open your browser and go to: http://localhost:8000/api/health/
2. You should see a JSON response like: `{"status": "ok"}`
3. Try the admin panel: http://localhost:8000/admin/
4. Log in with your superuser credentials

### 7.3 Check Supabase Dashboard
1. Go back to your Supabase dashboard
2. Click on **"Table Editor"** in the left sidebar
3. You should see tables like `core_user`, `core_unit`, `core_group`, etc.
4. This confirms your data is being stored in Supabase!

---

## 🎉 Success!

If you've reached this point, your Django application is now connected to Supabase! 

**What's Next:**
- Your database is now in the cloud (Supabase)
- You can access it from anywhere
- Your data persists even if you restart your computer
- You can view/edit data in the Supabase dashboard

---

## 🔧 Optional: Connection Pooling (For Production)

For better performance in production, Supabase recommends using connection pooling:

1. In Supabase dashboard: **Settings** → **Database**
2. Scroll to **"Connection pooling"** section
3. Copy the **"Session mode"** connection string (port 5432)
4. Extract the host (it will be `pooler.supabase.com` or similar)
5. Update your `.env` file with the pooled host

**Note:** For development, the regular connection is fine. Use pooling for production deployments.

---

## Connection String Format Reference

Supabase provides connection strings in this format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Breaking it down:**
- `postgresql://` - Protocol
- `postgres` - Username (before the `:`)
- `[YOUR-PASSWORD]` - Your password (between `:` and `@`)
- `db.[PROJECT-REF].supabase.co` - Host (between `@` and `:`)
- `5432` - Port (between `:` and `/`)
- `postgres` - Database name (after the `/`)

---

## 🐛 Troubleshooting

### Error: "Connection timeout" or "Could not connect to server"
**Solutions:**
- ✅ Check your internet connection
- ✅ Verify the `DB_HOST` in your `.env` file is correct
- ✅ Make sure your Supabase project is active (not paused)
- ✅ Check Windows Firewall isn't blocking the connection
- ✅ Try pinging the host: `ping db.your-project.supabase.co`

### Error: "Authentication failed" or "Password authentication failed"
**Solutions:**
- ✅ Double-check your `DB_PASS` in `.env` matches the password you set
- ✅ Make sure there are no extra spaces in your `.env` file
- ✅ Verify `DB_USER` is `postgres` (not `postgres ` with a space)
- ✅ Try resetting your database password in Supabase dashboard

### Error: "SSL connection required"
**Solutions:**
- ✅ Your Django settings already have SSL configured (`sslmode: require`)
- ✅ Make sure you're using `psycopg2-binary` (already in requirements.txt)
- ✅ If still failing, check that your `.env` file is being loaded correctly

### Error: "Module 'psycopg2' not found"
**Solutions:**
- ✅ Make sure your virtual environment is activated
- ✅ Install dependencies: `pip install -r requirements.txt`
- ✅ Verify `psycopg2-binary` is installed: `pip list | findstr psycopg2`

### Error: "Database does not exist"
**Solutions:**
- ✅ Make sure `DB_NAME=postgres` (not `yirok_db` or something else)
- ✅ Supabase uses `postgres` as the default database name

### My Supabase Project is Paused
**Solution:**
- Free tier projects pause after 1 week of inactivity
- Go to your Supabase dashboard and click "Restore project"
- Wait a few minutes for it to wake up

---

## 🔒 Security Notes

- ⚠️ **NEVER commit your `.env` file to git** - it contains sensitive passwords
- ✅ Make sure `.env` is in your `.gitignore` file
- ✅ Use different Supabase projects for development and production
- ✅ Keep your database password secure
- ✅ Don't share your `.env` file with anyone
- ✅ Use strong passwords for your Supabase database

---

## 📝 Quick Reference Checklist

Use this checklist to make sure you've completed everything:

- [ ] Created Supabase account and project
- [ ] Saved the database password securely
- [ ] Found connection details in Supabase dashboard
- [ ] Created/updated `.env` file with correct values
- [ ] Activated virtual environment
- [ ] Tested connection with `python manage.py check`
- [ ] Ran migrations successfully
- [ ] Created superuser account
- [ ] Verified connection in browser (http://localhost:8000/api/health/)
- [ ] Checked tables appear in Supabase dashboard

---

**Need more help?** Check the main [QUICKSTART.md](QUICKSTART.md) guide or review the error messages carefully - they usually tell you exactly what's wrong!

## Connection String Format

Supabase provides connection strings in this format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Break it down:
- **Host**: `db.[PROJECT-REF].supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `[YOUR-PASSWORD]`

## Troubleshooting

### Connection Timeout
- Check your firewall settings
- Verify the host address is correct
- Make sure you're using the correct port (5432)

### Authentication Failed
- Double-check your password
- Make sure you're using the `postgres` user
- Verify the host address matches your project

### SSL Required
Supabase requires SSL connections. Django's psycopg2 should handle this automatically, but if you get SSL errors, you may need to add SSL settings to your Django settings.

## Security Notes

- **Never commit your `.env` file to git**
- Keep your database password secure
- Use different credentials for production
- Consider using Supabase's connection pooling for better performance



