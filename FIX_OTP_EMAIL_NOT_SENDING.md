# Fix OTP Email Not Sending

## Problem
OTP emails are not being sent because `EMAIL_BACKEND` is set to `console` (logs only) when `DEBUG=True`.

---

## ✅ Solution 1: Get OTP from Browser Console (Quick Test)

Since `DEBUG=True`, the OTP code is included in the API response for testing.

### Steps:
1. Open your frontend: https://green-eyes-frontend.onrender.com/
2. Open **Developer Tools** (Press `F12`)
3. Go to **Network** tab
4. Enter your email: `someoneimportant.spam@gmail.com`
5. Click **"Request OTP"**
6. In Network tab, find the request: `request-otp`
7. Click on it → **Response** tab
8. You'll see JSON like:
```json
{
  "message": "OTP sent to your email address.",
  "otp_code": "123456",
  "expires_in_minutes": 10,
  "debug_note": "OTP code included in response for development..."
}
```
9. **Copy the `otp_code` value**
10. **Paste it** in the OTP input field
11. **Log in!**

### Visual Guide:
```
Browser Developer Tools (F12)
├── Network Tab
│   ├── Find: request-otp/ (POST request)
│   └── Response:
│       {
│         "otp_code": "123456"  ← USE THIS CODE!
│       }
```

---

## ✅ Solution 2: Check Render Logs (Alternative)

OTP codes are also printed in the backend logs.

### Steps:
1. Go to **Render Dashboard**
2. Open **green_eyes_backend** service
3. Click **Logs** tab
4. In your frontend, request OTP
5. In logs, search for: `"Your OTP code"` or `"123456"`
6. You'll see the email content with the OTP code:
```
Your OTP code for account verification is: 123456

This code will expire in 10 minutes.
```
7. Copy the 6-digit code
8. Use it to log in

---

## ✅ Solution 3: Configure Real Email (Production)

To actually send emails via Gmail SMTP:

### Step 1: Get Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in with your Gmail account
3. Create new app password:
   - App: "Mail"
   - Device: "Render Server"
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Set Environment Variables in Render

**Render Dashboard** → **green_eyes_backend** → **Environment** → Add:

```bash
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=baenaimyarok@gmail.com
EMAIL_HOST_PASSWORD=abcdefghijklmnop
DEFAULT_FROM_EMAIL=baenaimyarok@gmail.com
```

Replace `abcdefghijklmnop` with your actual Gmail App Password (no spaces).

### Step 3: Deploy
The service will automatically redeploy when you save environment variables.

### Step 4: Test
Request OTP again - you should receive a real email!

---

## 🔍 Troubleshooting

### "OTP code not in API response"
- Make sure `DEBUG=True` in Render environment variables
- Check if the API request succeeded (200 OK status)
- Look at Console tab for any JavaScript errors

### "Can't find OTP in logs"
- Make sure you're looking at the **latest logs** (refresh)
- Try searching for the email address instead
- Look for lines containing `send_mail` or `OTP`

### Gmail App Password not working
- Make sure 2-Factor Authentication is enabled on Gmail
- Use the password **without spaces**
- Use the Gmail account that matches `EMAIL_HOST_USER`
- Check Render logs for SMTP errors

### Still not receiving emails
- Check spam/junk folder
- Verify the Gmail account is active
- Test with a different email provider (SendGrid, Mailgun)

---

## 📝 Notes

- **Option 1** (Browser Console) is fastest for testing
- **Option 2** (Logs) works if console isn't accessible
- **Option 3** (Real SMTP) is required for production

- The OTP code is **6 digits**
- It **expires in 10 minutes**
- It can only be **used once**

---

## For Production: Disable DEBUG

Once everything works, set in Render:

```bash
DEBUG=False
```

This will:
- Remove OTP from API responses (security)
- Disable detailed error pages
- Force SMTP email backend
- Enable production optimizations

