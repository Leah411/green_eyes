# Setup Gmail SMTP for Real Email Sending

## Step 1: Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Google account
3. Select "Mail" and "Other (Custom name)"
4. Name it "Green Eyes" or "Yirok App"
5. Click "Generate"
6. **Copy the 16-character password** (you'll only see it once!)
   - It will look like: `abcd efgh ijkl mnop`

## Step 2: Update .env File

Add these lines to your `.env` file:

```env
# Change from console to SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# Gmail SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-character-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**Important:** 
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the app password from Step 1 (remove spaces)
- Make sure `DB_USE_SQLITE=true` is still in your .env file

## Step 3: Restart Django Server

After updating `.env`, restart your Django server:
1. Stop the current server (close the PowerShell window or press Ctrl+C)
2. Start it again: `python manage.py runserver`

## Step 4: Test

Request an OTP again - you should now receive it in your actual email inbox!

---

## Alternative: Keep Console Backend but Check Response

If you want to keep using console backend for now, the OTP code is included in the API response when DEBUG=True.

Look for `otp_code` in the response from `/api/auth/request-otp/`

