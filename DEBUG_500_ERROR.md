# Debug 500 Error - Step by Step

## Current Issue
- React errors (#418, #423) - These are secondary, caused by the 500 error
- **Main problem**: `POST /api/auth/request-otp/ 500 (Internal Server Error)`

## Step 1: Check Backend Logs (CRITICAL!)

This is the most important step to find the actual error.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Open your **Backend Service**
3. Click **"Logs"** tab
4. Scroll down to see the most recent errors
5. Look for errors related to:
   - `request-otp`
   - `email`
   - `smtp`
   - `send_mail`
   - `database`
   - `connection`

**What to look for:**
- Red error messages
- Stack traces
- Specific error messages like:
  - `SMTPAuthenticationError`
  - `could not connect to server`
  - `EMAIL_HOST_PASSWORD not set`
  - `ModuleNotFoundError`
  - etc.

**Copy the exact error message** - this will tell us what's wrong!

## Step 2: Verify Environment Variables

Make sure ALL these are set in Render Dashboard → Backend Service → Environment:

### Database (Supabase):
- [ ] `DB_NAME=postgres`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASS=i52hd1FMm3mnwJVX` ✅ (you have this)
- [ ] `DB_HOST=db.your-project-ref.supabase.co` ⚠️ (need this!)
- [ ] `DB_PORT=5432`

### Django:
- [ ] `SECRET_KEY` (secure random key)
- [ ] `DEBUG=False`
- [ ] `ALLOWED_HOSTS=green-eyes-uaw4.onrender.com`

### Email (for testing - use Console):
- [ ] `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`

Or for production (Gmail):
- [ ] `EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend`
- [ ] `EMAIL_HOST=smtp.gmail.com`
- [ ] `EMAIL_PORT=587`
- [ ] `EMAIL_USE_TLS=True`
- [ ] `EMAIL_HOST_USER=your-email@gmail.com`
- [ ] `EMAIL_HOST_PASSWORD=your-app-password`
- [ ] `DEFAULT_FROM_EMAIL=your-email@gmail.com`

### CORS:
- [ ] `CORS_ALLOWED_ORIGINS=https://green-eyes-frontend.onrender.com`

## Step 3: Quick Test - Use Console Backend

To isolate if the problem is Email configuration:

1. Render Dashboard → Backend Service → Environment
2. Set:
   ```
   EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
   ```
3. **Remove** all other EMAIL_* variables (or leave them, they'll be ignored)
4. Save and wait for redeploy (2-3 minutes)
5. Try requesting OTP again

**If this works:**
- The problem is Email configuration
- OTP will appear in Logs (not sent via email)
- You can use the OTP from Logs to login

**If this still gives 500 error:**
- The problem is NOT Email
- Check Database connection
- Check other environment variables
- Check Logs for the actual error

## Step 4: Check Database Connection

If Console Backend still gives 500, check database:

1. Check Logs for database errors:
   - `could not connect to server`
   - `authentication failed`
   - `relation does not exist`

2. Verify Supabase credentials:
   - Go to Supabase Dashboard
   - Settings → Database
   - Verify your connection string matches what you set in Render

3. Test database connection:
   - Check if migrations ran successfully in Logs
   - Look for: `Applying migrations... OK`

## Step 5: Common Error Messages and Solutions

### Error: "SMTPAuthenticationError" or "Invalid credentials"
**Solution:** 
- Use Gmail App Password (not regular password)
- Get from: https://myaccount.google.com/apppasswords
- Make sure `EMAIL_HOST_USER` and `DEFAULT_FROM_EMAIL` are identical

### Error: "could not connect to server"
**Solution:**
- Check `DB_HOST` is correct
- Verify Supabase project is active (not paused)
- Check `DB_PORT=5432`

### Error: "authentication failed"
**Solution:**
- Check `DB_PASS` matches Supabase password
- Verify `DB_USER=postgres`
- No extra spaces in environment variables

### Error: "EMAIL_HOST_PASSWORD not set"
**Solution:**
- Add `EMAIL_HOST_PASSWORD` environment variable
- Or use Console Backend instead

### Error: "relation does not exist"
**Solution:**
- Database connected but migrations not run
- Check if migrations ran in Logs
- They should run automatically in pre-deploy

## What to Do Right Now

1. ✅ **Check Backend Logs** - What's the exact error?
2. ✅ **Try Console Backend** - Does it work?
3. ✅ **Verify all Environment Variables** - Are they all set?
4. ✅ **Check Database Connection** - Are migrations running?

## Send Me

To help you fix this, I need:
1. **The exact error from Backend Logs** (copy the error message)
2. **Did Console Backend work?** (yes/no)
3. **List of environment variables you have set** (without passwords)

With this information, I can help you fix the exact issue!


