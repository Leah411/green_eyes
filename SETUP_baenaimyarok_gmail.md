# Setup Instructions for baenaimyarok@gmail.com

## Step-by-Step Guide

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Sign in with: **baenaimyarok@gmail.com**
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started**
5. Follow the prompts:
   - Verify your phone number
   - Complete the setup

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Make sure you're signed in as **baenaimyarok@gmail.com**
2. You might need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Type: **Green Eyes App**
6. Click **Generate**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: Copy it now! You won't see it again!

### Step 3: Update Your .env File

Open your `.env` file and add/update these lines:

```env
# Email Configuration (Gmail)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=baenaimyarok@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password-here
DEFAULT_FROM_EMAIL=baenaimyarok@gmail.com
```

**Replace `your-16-char-app-password-here` with the App Password you copied!**

**Important:**
- Remove spaces from the App Password (e.g., `abcdefghijklmnop` instead of `abcd efgh ijkl mnop`)
- No spaces around the `=` signs

### Step 4: Restart Django Server

1. Stop Django server (Ctrl+C)
2. Restart:
   ```bash
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

### Step 5: Test It!

1. Go to: http://localhost:3000
2. Request an OTP
3. Check the inbox of **baenaimyarok@gmail.com** for the OTP code!

---

## Quick Setup Script

I've created a script to help you update the .env file automatically. After you get your App Password:

```powershell
.\update_env_email.ps1
```

The script will ask for your App Password and update the .env file automatically.

---

## Troubleshooting

### "App Passwords setting is not available"

If you still see this error:
1. Make sure 2FA is **fully enabled** (not just started)
2. Wait 5-10 minutes after enabling 2FA
3. Try signing out and back into Google
4. Try a different browser

### "Invalid credentials" error

- Make sure you're using the **App Password**, not your regular Gmail password
- Make sure there are no spaces in the App Password in `.env`
- Verify 2FA is enabled

### Test Email Connection

Test if email is working:

```bash
.\venv\Scripts\Activate.ps1
python manage.py shell
```

Then:
```python
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'This is a test email from Green Eyes',
    'baenaimyarok@gmail.com',
    ['your-test-email@gmail.com'],
    fail_silently=False,
)
```

If it returns `1`, email is working! ✅

---

## Summary

✅ **Email**: baenaimyarok@gmail.com  
✅ **Steps**:
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env` file (see above)
4. Restart Django
5. Test!

**After setup, all OTP emails will be sent FROM baenaimyarok@gmail.com TO user email addresses!**


