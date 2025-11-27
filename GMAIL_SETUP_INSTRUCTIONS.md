# Gmail Setup Instructions for yrok.beenayim.app@gmail.com

## Step-by-Step Guide to Configure Gmail for Sending OTP Emails

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account: https://myaccount.google.com
2. Click on **Security** (left sidebar)
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts to enable 2FA
   - You'll need to verify your phone number
   - This is required to generate App Passwords

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. You might need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Type: **Green Eyes App**
6. Click **Generate**
7. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: Copy it now! You won't be able to see it again!

### Step 3: Update Your .env File

Open your `.env` file in the project root and add/update these lines:

```env
# Email Configuration (Gmail)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=yrok.beenayim.app@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password-here
DEFAULT_FROM_EMAIL=yrok.beenayim.app@gmail.com
```

**Replace `your-16-char-app-password-here` with the App Password you copied in Step 2!**

**Important Notes:**
- Remove any spaces from the App Password (e.g., `abcdefghijklmnop` instead of `abcd efgh ijkl mnop`)
- Make sure there are **no spaces** around the `=` signs
- The App Password is different from your regular Gmail password

### Step 4: Restart Django Server

After updating `.env`, you need to restart Django:

1. **Stop the current server** (press `Ctrl+C` in the terminal where Django is running)
2. **Restart it**:
   ```bash
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

### Step 5: Test It!

1. Go to your app: http://localhost:3000
2. Request an OTP with a user email
3. Check the inbox of `yrok.beenayim.app@gmail.com` for the OTP code!

---

## Troubleshooting

### "Invalid credentials" error?

- Make sure you're using the **App Password**, not your regular Gmail password
- Make sure 2FA is enabled on your Google account
- Try generating a new App Password

### "Less secure app" error?

- Gmail no longer supports "less secure apps"
- You **must** use an App Password (not your regular password)
- Make sure 2FA is enabled

### Emails not arriving?

1. Check **Spam folder** in Gmail
2. Check Django logs: `logs/django.log` for error messages
3. Verify the `.env` file has the correct settings
4. Make sure Django server was restarted after updating `.env`

### Test Email Connection

You can test if email is working by running:

```bash
.\venv\Scripts\Activate.ps1
python manage.py shell
```

Then in the shell:
```python
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'This is a test email from Green Eyes',
    'yrok.beenayim.app@gmail.com',
    ['your-test-email@gmail.com'],
    fail_silently=False,
)
```

If it works, you'll see `1` (number of emails sent). If there's an error, it will show you what's wrong.

---

## Summary

✅ **Email Address**: `yrok.beenayim.app@gmail.com`  
✅ **Next Steps**:
1. Enable 2FA on Google Account
2. Generate App Password
3. Update `.env` file with the settings above
4. Restart Django server
5. Test by requesting an OTP

**After setup, OTP emails will be sent from `yrok.beenayim.app@gmail.com` to user email addresses!**


