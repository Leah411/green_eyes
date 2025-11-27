# Email Setup Guide - How OTP Emails Are Sent

## Current Status

**Your emails are currently being sent to the CONSOLE, not to real email addresses!**

This is because `EMAIL_BACKEND` is set to `django.core.mail.backends.console.EmailBackend` in development mode.

## Where to Find Your OTP Codes Right Now

**Check the terminal/console where Django is running!**

When you request an OTP, you should see output like this in the Django console:

```
Content-Type: text/html; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Your OTP Code for Account Verification
From: noreply@yirok.com
To: someoneimportant.spam@gmail.com
Date: ...

[HTML email content with OTP code]
```

**The OTP code will be in that console output!**

---

## Option 1: Keep Using Console Backend (Development)

If you're just testing locally, you can continue using the console backend. Just check the Django terminal for the OTP codes.

**No changes needed** - this is already configured.

---

## Option 2: Configure Real Email Sending (Production/Testing)

To actually send emails to real email addresses, you need to configure SMTP.

### Step 1: Choose an Email Service

Popular options:
- **Gmail** (free, easy setup)
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very cheap)

### Step 2: Get SMTP Credentials

#### For Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an "App Password": https://myaccount.google.com/apppasswords
3. Use these settings:
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: Your Gmail address
   - Password: The app password (not your regular password)

#### For SendGrid:
1. Sign up at https://sendgrid.com
2. Create an API key
3. Use these settings:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: Your SendGrid API key

### Step 3: Update `.env` File

Edit your `.env` file in the project root:

```env
# Change from console backend to SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# Gmail Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# OR SendGrid Configuration
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=apikey
# EMAIL_HOST_PASSWORD=your-sendgrid-api-key
# DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Step 4: Restart Django Server

After updating `.env`, restart your Django server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
python manage.py runserver
```

### Step 5: Test Email Sending

Try requesting an OTP again. The email should now be sent to the actual email address!

---

## Option 3: Use a File Backend (Alternative for Testing)

If you want to save emails to files instead of console, you can use:

```env
EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend
EMAIL_FILE_PATH=/path/to/email/messages
```

Emails will be saved as `.eml` files in the specified directory.

---

## How OTP Emails Are Sent (Code Flow)

1. **User requests OTP** via `POST /api/auth/request-otp/`
2. **Backend validates** the request (user exists, is approved, rate limit OK)
3. **OTP code is generated** (6-digit random number)
4. **OTP is saved** to database (`OTPToken` model)
5. **Email is sent** via `send_otp_email()` function:
   - Loads HTML template from `core/email_templates/otp_login.html`
   - Falls back to plain text if template fails
   - Uses Django's `send_mail()` function
   - Uses `EMAIL_BACKEND` from settings to actually send

---

## Troubleshooting

### Emails not appearing in console?

1. Make sure Django server is running
2. Check the terminal/console window where you ran `python manage.py runserver`
3. Look for email output after requesting OTP

### SMTP not working?

1. **Check credentials** - Make sure username/password are correct
2. **Check firewall** - Port 587 might be blocked
3. **Check logs** - Look in `logs/django.log` for error messages
4. **Test connection** - Try sending a test email:

```python
python manage.py shell
>>> from django.core.mail import send_mail
>>> send_mail('Test', 'Test message', 'from@example.com', ['to@example.com'])
```

### Gmail "Less secure app" error?

Gmail no longer supports "less secure apps". You **must** use an App Password:
1. Enable 2FA on your Google account
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the App Password (16 characters) as `EMAIL_HOST_PASSWORD`

---

## Quick Setup for Gmail (Recommended for Testing)

1. **Enable 2FA** on your Gmail account
2. **Generate App Password**: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Green Eyes"
   - Copy the 16-character password
3. **Update `.env`**:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```
4. **Restart Django server**
5. **Test** - Request an OTP and check your email inbox!

---

## Current Configuration Check

Run this to see your current email settings:

```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('EMAIL_BACKEND:', os.getenv('EMAIL_BACKEND', 'NOT SET (using default)')); print('DEBUG:', os.getenv('DEBUG', 'NOT SET'))"
```

**Current status:** Console backend (emails go to terminal)

---

## Summary

- ✅ **Right now**: Emails are printed to Django console (check terminal)
- 🔧 **To send real emails**: Configure SMTP in `.env` file
- 📧 **Recommended**: Use Gmail with App Password for testing
- 🚀 **Production**: Use SendGrid, Mailgun, or AWS SES

**Next step**: Check your Django console terminal for OTP codes, or configure SMTP to send real emails!


