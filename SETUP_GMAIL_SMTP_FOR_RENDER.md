# Setup Gmail SMTP for Render (Send Real Emails)

## Problem
- OTP emails are not being sent (console backend only)
- Admin notifications for new user registrations are not being sent

## Solution: Configure Gmail SMTP

---

## Step 1: Create Gmail App Password

Gmail requires an "App Password" for external applications (not your regular Gmail password).

### Prerequisites:
- You must have **2-Factor Authentication** enabled on your Gmail account

### Steps:
1. Go to: **https://myaccount.google.com/apppasswords**
2. Sign in with your Gmail account: `baenaimyarok@gmail.com`
3. You'll see "App passwords" page
4. Create new app password:
   - **App name:** "Render Green Eyes" (or any name)
   - Click **"Create"**
5. Copy the **16-character password** (e.g., `abcd efgh ijkl mnop`)
   - **Important:** Copy it now, you won't see it again!
   - Remove spaces: `abcdefghijklmnop`

### If you don't see "App passwords":
1. Make sure 2-Factor Authentication is enabled:
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification" and turn it ON
2. Try accessing App passwords again

---

## Step 2: Configure Render Environment Variables

### Go to Render Dashboard:
1. Open: https://dashboard.render.com
2. Click on **"green_eyes_backend"** service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**

### Add These Variables:

```bash
# Force SMTP backend (override console)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend

# Gmail SMTP settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=baenaimyarok@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=baenaimyarok@gmail.com
```

**Replace `abcdefghijklmnop`** with your actual 16-character Gmail App Password (no spaces).

### Screenshot Guide:
```
Render Dashboard → green_eyes_backend → Environment

Add each variable:
┌────────────────────────────────────────────────┐
│ Key: EMAIL_BACKEND                              │
│ Value: django.core.mail.backends.smtp.EmailBackend │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: EMAIL_HOST                                 │
│ Value: smtp.gmail.com                          │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: EMAIL_PORT                                 │
│ Value: 587                                      │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: EMAIL_USE_TLS                              │
│ Value: True                                     │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: EMAIL_HOST_USER                            │
│ Value: baenaimyarok@gmail.com                  │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: EMAIL_HOST_PASSWORD                        │
│ Value: [Your 16-character App Password]        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ Key: DEFAULT_FROM_EMAIL                         │
│ Value: baenaimyarok@gmail.com                  │
└────────────────────────────────────────────────┘
```

---

## Step 3: Save and Deploy

1. Click **"Save Changes"** at the bottom
2. Render will **automatically redeploy** the backend service
3. Wait 2-3 minutes for deployment to complete

---

## Step 4: Test Email Sending

### Test 1: Request OTP
1. Go to: https://green-eyes-frontend.onrender.com/
2. Enter your email: `someoneimportant.spam@gmail.com`
3. Click **"Request OTP"**
4. Check your email inbox (might be in spam/junk folder)
5. You should receive an email with subject: **"Your OTP Code for Account Verification"**
6. Copy the 6-digit code
7. Enter it to log in

### Test 2: New User Registration (Admin Notification)
1. Have someone register a new account (or create a test one)
2. Check the admin email: `someoneimportant.spam@gmail.com`
3. You should receive an email with subject: **"🔔 New User Registration: [email]"**
4. This email tells you someone is waiting for approval

---

## What Emails Will Be Sent?

### 1. OTP Login Emails
- **To:** User requesting OTP
- **Subject:** "Your OTP Code for Account Verification"
- **Content:** 6-digit code, expires in 10 minutes

### 2. Admin Notification on Registration
- **To:** All superuser/admin accounts
- **Subject:** "🔔 New User Registration: [user email]"
- **Content:** User details, link to approve
- **When:** Immediately when someone registers

### 3. User Approval Notification
- **To:** User being approved
- **Subject:** "Access Request Approved"
- **Content:** Confirmation that they can now log in

---

## Troubleshooting

### "Username and password not accepted"
- Double-check the App Password (no spaces, 16 characters)
- Make sure you're using `baenaimyarok@gmail.com` as EMAIL_HOST_USER
- Verify 2FA is enabled on the Gmail account
- Try generating a new App Password

### "Connection refused" or "Connection timed out"
- Check EMAIL_PORT is `587` (not 465 or 25)
- Verify EMAIL_USE_TLS is `True`
- Check EMAIL_HOST is `smtp.gmail.com`

### Email not arriving
- Check spam/junk folder
- Verify the recipient email is correct
- Check Render logs for errors:
  ```
  Render Dashboard → green_eyes_backend → Logs
  Search for: "Error sending" or "SMTP"
  ```

### Still receiving emails in console only
- Make sure `EMAIL_BACKEND` is set to `django.core.mail.backends.smtp.EmailBackend`
- Verify you saved the environment variables
- Check if the service redeployed after saving
- Try a manual deploy: Render Dashboard → Manual Deploy

### Admin not receiving registration notifications
- Make sure your superuser account has a valid email
- Check that `is_superuser=True` for your admin account
- Verify the email in Render logs:
  ```
  Search for: "Sending new user notification to admins"
  ```

---

## Security Notes

### ✅ DO:
- Use Gmail App Passwords (not your real Gmail password)
- Keep `EMAIL_HOST_PASSWORD` secret (Render hides it)
- Enable 2FA on Gmail

### ❌ DON'T:
- Share your App Password
- Commit `EMAIL_HOST_PASSWORD` to Git
- Use your real Gmail password

---

## Alternative Email Providers

If Gmail doesn't work, you can use:

### SendGrid (Free 100 emails/day):
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=[Your SendGrid API Key]
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

### Mailgun:
```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=[Your Mailgun SMTP username]
EMAIL_HOST_PASSWORD=[Your Mailgun SMTP password]
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
```

---

## Summary

After setup, you'll receive emails for:
✅ OTP codes when users log in
✅ Admin notifications when someone registers
✅ User approval confirmations

All emails will be sent from: `baenaimyarok@gmail.com`

