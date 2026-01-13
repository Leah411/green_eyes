# Verify Render Environment Variables

## Quick Verification Steps

Before deploying, verify your Render environment variables are correctly configured.

### Step 1: Go to Render Dashboard

1. Open [Render Dashboard](https://dashboard.render.com)
2. Click on **green_eyes_backend** service
3. Click **Environment** tab

### Step 2: Check Each Variable

Go through this checklist and verify EXACTLY:

#### Database Variables

| Variable | Expected Value | Your Value | ✓ |
|----------|---------------|------------|---|
| `DB_NAME` | `postgres` | ___________ | ☐ |
| `DB_USER` | `postgres.fhikehkuookglfjomxen` | ___________ | ☐ |
| `DB_PASS` | `BnDgPKyYpjHCx9vy` (16 chars) | ___________ | ☐ |
| `DB_HOST` | `aws-1-ap-southeast-2.pooler.supabase.com` | ___________ | ☐ |
| `DB_PORT` | `6543` | ___________ | ☐ |

#### Django Variables

| Variable | Expected Value | Your Value | ✓ |
|----------|---------------|------------|---|
| `SECRET_KEY` | (unique 50+ char string) | ___________ | ☐ |
| `DEBUG` | `False` | ___________ | ☐ |
| `ALLOWED_HOSTS` | `green-eyes-uaw4.onrender.com` | ___________ | ☐ |

#### CORS Variables

| Variable | Expected Value | Your Value | ✓ |
|----------|---------------|------------|---|
| `CORS_ALLOWED_ORIGINS` | `https://green-eyes-frontend.onrender.com` | ___________ | ☐ |

### Step 3: Common Mistakes to Check

**DB_PASS:**
- [ ] No extra spaces before or after
- [ ] Exactly 16 characters: `BnDgPKyYpjHCx9vy`
- [ ] Copy-paste directly (don't type manually)

**DB_USER:**
- [ ] Includes project reference: `postgres.fhikehkuookglfjomxen`
- [ ] Not just `postgres`
- [ ] Dot (.) between postgres and project ref

**DB_HOST:**
- [ ] Uses pooler: `aws-1-ap-southeast-2.pooler.supabase.com`
- [ ] NOT the direct host: `db.fhikehkuookglfjomxen.supabase.co`

**DB_PORT:**
- [ ] Is `6543` (Transaction Pooler)
- [ ] NOT `5432` (direct connection)

**CORS_ALLOWED_ORIGINS:**
- [ ] Starts with `https://`
- [ ] No trailing slash `/`
- [ ] No spaces

### Step 4: If Any Variables Are Missing or Wrong

1. Click **"Add Environment Variable"** (for missing) or click the variable to edit
2. Enter the correct value
3. Click **"Save Changes"**

### Step 5: After Verification

Once all variables are correct:

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Go to **Logs** tab
3. Wait for deployment to complete
4. Look for startup messages (see next section)

---

## Expected Log Output

After successful deployment, you should see:

```
[DB CONFIG] Reading from env vars: DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT
[DB CONFIG] Using Supabase Transaction Pooler (IPv4 compatible, pool_mode: transaction)
[DB CONFIG] DB_NAME (database): postgres
[DB CONFIG] DB_USER (user): postgres.fhikehkuookglfjomxen
[DB CONFIG] DB_HOST (host): aws-1-ap-southeast-2.pooler.supabase.com
[DB CONFIG] DB_PORT (port): 6543
[DB CONFIG] DB_PASS (password): **************** (length: 16)
[STARTUP] ========================================
[STARTUP] Green Eyes API Server Starting...
[STARTUP] Database Engine: django.db.backends.postgresql
[STARTUP] Database Host: aws-1-ap-southeast-2.pooler.supabase.com
[STARTUP] Database Port: 6543
[STARTUP] Testing database connection...
[STARTUP] ✓ Database connection successful (test query returned: (1,))
[STARTUP] Database Version: PostgreSQL 15.x...
[STARTUP] ✓ core_user table exists: 0 users
[STARTUP] ✓ core_profile table exists: 0 profiles
[STARTUP] ✓ core_unit table exists: 0 units
[STARTUP] ✓ core_otptoken table exists: 0 tokens
[STARTUP] ========================================
[STARTUP] ✓ API Server is READY and HEALTHY
[STARTUP] ========================================
```

---

## Error Messages to Look For

### ❌ "Database password not set"

**Cause:** `DB_PASS` (or `password`) variable is missing

**Fix:** Add `DB_PASS=BnDgPKyYpjHCx9vy` in Environment tab

### ❌ "Circuit breaker open: Too many authentication errors"

**Cause:** Wrong password or wrong username

**Fix:**
1. Verify `DB_PASS` = `BnDgPKyYpjHCx9vy` (exactly)
2. Verify `DB_USER` = `postgres.fhikehkuookglfjomxen` (with dot)
3. Wait 5-10 minutes for circuit breaker to reset
4. Redeploy

### ❌ "connection to server ... failed: Network is unreachable"

**Cause:** Using direct connection (port 5432) instead of pooler

**Fix:**
1. Set `DB_HOST` = `aws-1-ap-southeast-2.pooler.supabase.com`
2. Set `DB_PORT` = `6543`
3. Redeploy

### ❌ "WARNING: Password length is X, expected 16"

**Cause:** Extra spaces in password or wrong password

**Fix:**
1. Edit `DB_PASS` variable
2. Delete any extra spaces
3. Set to exactly: `BnDgPKyYpjHCx9vy`
4. Redeploy

---

## Quick Test After Deploy

### Test 1: Health Check

```bash
curl https://green-eyes-uaw4.onrender.com/api/health/
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-13T...",
  "version": "1.0.0",
  "message": "API is running and available"
}
```

### Test 2: Root Endpoint

```bash
curl https://green-eyes-uaw4.onrender.com/
```

Expected response:
```json
{
  "name": "Green Eyes API",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "api": "/api/",
    "health": "/api/health/",
    "admin": "/admin/"
  }
}
```

### Test 3: Register Endpoint (If Frontend Connected)

From browser console:
```javascript
fetch('https://green-eyes-uaw4.onrender.com/api/auth/register/', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User'
  })
})
.then(r => r.json())
.then(console.log)
```

---

## Checklist Summary

Before marking as complete:

- [ ] All database variables are set correctly
- [ ] All Django variables are set correctly
- [ ] CORS variable is set correctly
- [ ] No common mistakes (spaces, wrong port, etc.)
- [ ] Deployed and logs show successful startup
- [ ] Health check endpoint returns 200 OK
- [ ] No authentication errors in logs

If all checks pass, the API is ready for client connections!

