# Render Environment Variables Setup Guide

## Complete Configuration for Green Eyes API

This guide shows EXACTLY what environment variables need to be set in Render Dashboard for the API to work correctly.

## Location

**Render Dashboard** → **green_eyes_backend** service → **Environment** tab

---

## Required Environment Variables

### 1. Supabase Database Configuration

These variables connect to your Supabase PostgreSQL database using the Transaction Pooler (port 6543).

```bash
# Database connection - Supabase Transaction Pooler
DB_NAME=postgres
DB_USER=postgres.fhikehkuookglfjomxen
DB_PASS=BnDgPKyYpjHCx9vy
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=6543
```

**Important Notes:**
- `DB_USER` must include the project reference: `postgres.PROJECT_REF`
- `DB_PASS` is exactly 16 characters (no spaces before or after)
- `DB_HOST` uses the pooler endpoint (not `db.xxxxx.supabase.co`)
- `DB_PORT` is 6543 for the Transaction Pooler (not 5432 direct connection)

**Why Transaction Pooler?**
- Direct connection (port 5432) fails on Render due to IPv6 issues
- Transaction Pooler (port 6543) uses IPv4 and works on Render
- PgBouncer handles connection pooling for better performance

---

### 2. Django Security Settings

```bash
# Django secret key - MUST be unique and secret
SECRET_KEY=your-unique-secret-key-here-at-least-50-chars

# Debug mode - MUST be False in production
DEBUG=False

# Allowed hosts - your Render domain
ALLOWED_HOSTS=green-eyes-uaw4.onrender.com
```

**Generate a new SECRET_KEY:**
```python
# Run in Python shell:
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

**Important:**
- Never use the default `django-insecure-dev-key-change-in-production`
- `DEBUG=False` prevents sensitive info from being exposed
- `ALLOWED_HOSTS` must match your Render domain exactly

---

### 3. CORS Configuration

```bash
# Frontend URL for CORS
CORS_ALLOWED_ORIGINS=https://green-eyes-frontend.onrender.com
```

**For multiple frontends:**
```bash
CORS_ALLOWED_ORIGINS=https://green-eyes-frontend.onrender.com,https://your-custom-domain.com
```

**Important:**
- Must start with `https://`
- No trailing slash `/`
- Comma-separated for multiple origins (no spaces)

---

### 4. Email Configuration (Optional)

If you want to send OTP emails (not required for testing):

```bash
# Email backend
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

**For testing without email:**
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

---

## Complete Checklist

Copy this list and check off as you add each variable:

### Database (Required)
- [ ] `DB_NAME` = `postgres`
- [ ] `DB_USER` = `postgres.fhikehkuookglfjomxen`
- [ ] `DB_PASS` = `BnDgPKyYpjHCx9vy`
- [ ] `DB_HOST` = `aws-1-ap-southeast-2.pooler.supabase.com`
- [ ] `DB_PORT` = `6543`

### Django (Required)
- [ ] `SECRET_KEY` = (generate new unique key)
- [ ] `DEBUG` = `False`
- [ ] `ALLOWED_HOSTS` = `green-eyes-uaw4.onrender.com`

### CORS (Required)
- [ ] `CORS_ALLOWED_ORIGINS` = `https://green-eyes-frontend.onrender.com`

### Email (Optional)
- [ ] `EMAIL_BACKEND` = `django.core.mail.backends.console.EmailBackend`

---

## How to Add Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **green_eyes_backend** service
3. Click **"Environment"** tab on the left
4. Click **"Add Environment Variable"** button
5. Enter **Key** (e.g., `DB_NAME`)
6. Enter **Value** (e.g., `postgres`)
7. Click **"Save Changes"**
8. Repeat for all variables

**After adding all variables:**
- Click **"Manual Deploy"** → **"Deploy latest commit"**
- Or push new code to trigger auto-deploy

---

## Verification After Deploy

### Check Logs

Go to **Logs** tab and look for these messages:

```
[DB CONFIG] Using Supabase Transaction Pooler (IPv4 compatible, pool_mode: transaction)
[DB CONFIG] DB_NAME (database): postgres
[DB CONFIG] DB_USER (user): postgres.fhikehkuookglfjomxen
[DB CONFIG] DB_HOST (host): aws-1-ap-southeast-2.pooler.supabase.com
[DB CONFIG] DB_PORT (port): 6543
[DB CONFIG] DB_PASS (password): **************** (length: 16)
[STARTUP] ========================================
[STARTUP] Green Eyes API Server Starting...
[STARTUP] Testing database connection...
[STARTUP] ✓ Database connection successful
[STARTUP] ✓ core_user table exists: 0 users
[STARTUP] ✓ API Server is READY and HEALTHY
[STARTUP] ========================================
```

### Test Health Endpoint

```bash
curl https://green-eyes-uaw4.onrender.com/api/health/
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T...",
  "version": "1.0.0"
}
```

---

## Troubleshooting

### "Circuit breaker open: Too many authentication errors"

**Cause:** Wrong password or too many failed connection attempts

**Fix:**
1. Double-check `DB_PASS` has no extra spaces
2. Verify `DB_USER` includes project reference: `postgres.PROJECT_REF`
3. Wait 5-10 minutes for circuit breaker to reset
4. Redeploy after fixing credentials

### "Database password not set" error

**Cause:** Environment variable not configured in Render

**Fix:**
1. Go to Environment tab
2. Add `DB_PASS` (or `password`) variable
3. Redeploy

### Connection timeout

**Cause:** Using wrong port or host

**Fix:**
1. Use Transaction Pooler host: `aws-1-ap-southeast-2.pooler.supabase.com`
2. Use port `6543` (not `5432`)
3. Redeploy

### CORS errors in browser

**Cause:** Frontend URL not in `CORS_ALLOWED_ORIGINS`

**Fix:**
1. Add frontend URL to `CORS_ALLOWED_ORIGINS`
2. Must start with `https://`
3. No trailing slash
4. Redeploy backend

---

## Alternative: DATABASE_URL

Instead of individual variables, you can use a single `DATABASE_URL`:

```bash
DATABASE_URL=postgresql://postgres.fhikehkuookglfjomxen:BnDgPKyYpjHCx9vy@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**Pros:**
- Single variable instead of 5
- Standard PostgreSQL connection string

**Cons:**
- Password visible in one place
- Harder to update individual components

**Recommendation:** Use individual variables for better security and flexibility.

---

## Summary

The most critical variables for the API to work:

1. **DB_PASS** - Must be exactly correct (16 chars, no spaces)
2. **DB_USER** - Must include project reference (`postgres.PROJECT_REF`)
3. **DB_HOST** - Must use pooler endpoint
4. **DB_PORT** - Must be 6543 (not 5432)
5. **SECRET_KEY** - Must be unique and secret

After setting all variables, deploy and check logs for successful startup messages.

