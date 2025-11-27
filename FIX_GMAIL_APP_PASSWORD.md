# Fix Gmail Authentication Error

## Error Message
```
535, b'5.7.8 Username and Password not accepted'
```

## Problem
The password `Prism@7.10` is **not a valid App Password**. Google is rejecting it because:
- It's likely your regular Gmail password
- Google requires an **App Password** (16 characters) for SMTP access
- Regular passwords don't work for security reasons

## Solution: Create a Real App Password

### Step 1: Enable 2-Factor Authentication (If Not Already Enabled)

1. Go to: https://myaccount.google.com/security
2. Sign in with: **baenaimyarok@gmail.com**
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts
5. Verify your phone number

**⚠️ Important**: You MUST enable 2FA before you can create App Passwords!

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Make sure you're signed in as **baenaimyarok@gmail.com**
2. You might need to sign in again
3. Under "Select app", choose **Mail**
4. Under "Select device", choose **Other (Custom name)**
5. Type: **Green Eyes App**
6. Click **Generate**
7. **Copy the 16-character password** that appears
   - It will look like: `abcd efgh ijkl mnop` (with spaces)
   - Or: `abcdefghijklmnop` (without spaces)
   - **This is different from your regular password!**

### Step 3: Update .env File

**Option A: Use the script (Recommended)**
```powershell
.\update_env_email.ps1
```
When prompted, paste the 16-character App Password.

**Option B: Manual Update**

Open `.env` file and update:
```env
EMAIL_HOST_PASSWORD=your-16-char-app-password-here
```

**Important:**
- Remove spaces from the App Password (e.g., `abcdefghijklmnop`)
- Use the App Password, NOT your regular Gmail password
- No spaces around the `=` sign

### Step 4: Restart Django Server

1. Stop Django (Ctrl+C)
2. Restart:
   ```powershell
   .\venv\Scripts\Activate.ps1
   python manage.py runserver
   ```

### Step 5: Test

Try requesting an OTP again. It should work now!

---

## How to Identify a Real App Password

✅ **Real App Password:**
- 16 characters long
- Usually alphanumeric (letters and numbers)
- Example: `abcd efgh ijkl mnop` or `abcdefghijklmnop`
- Generated from: https://myaccount.google.com/apppasswords

❌ **NOT an App Password:**
- Your regular Gmail password
- Any password with special characters like `@`, `.`, etc.
- Example: `Prism@7.10` (this is a regular password)

---

## Troubleshooting

### "App Passwords setting is not available"

**Solution:**
1. Make sure 2FA is **fully enabled** (not just started)
2. Wait 5-10 minutes after enabling 2FA
3. Try signing out and back into Google
4. Try a different browser

### Still Getting "Username and Password not accepted"

**Check:**
1. ✅ Are you using the App Password (16 chars), not regular password?
2. ✅ Did you remove spaces from the App Password in `.env`?
3. ✅ Is 2FA enabled on your Google account?
4. ✅ Did you restart Django after updating `.env`?

### Test Email Connection

Test if email works:
```bash
.\venv\Scripts\Activate.ps1
python manage.py shell
```

Then:
```python
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'This is a test',
    'baenaimyarok@gmail.com',
    ['your-test-email@gmail.com'],
    fail_silently=False,
)
```

If it returns `1`, email is working! ✅

---

## Alternative: Use SendGrid (If Gmail Doesn't Work)

If you continue having issues with Gmail, consider using SendGrid instead:

1. Sign up: https://sendgrid.com (free - 100 emails/day)
2. Create API Key
3. Update `.env`:
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=SG.your-sendgrid-api-key
   DEFAULT_FROM_EMAIL=baenaimyarok@gmail.com
   ```

See `GMAIL_ALTERNATIVE_SETUP.md` for more details.

---

## Summary

**Current Problem**: Using regular Gmail password instead of App Password

**Solution**: 
1. Enable 2FA on Google account
2. Generate App Password from https://myaccount.google.com/apppasswords
3. Update `.env` with the 16-character App Password
4. Restart Django

**Next Step**: Follow Step 1 and Step 2 above to get your App Password!

