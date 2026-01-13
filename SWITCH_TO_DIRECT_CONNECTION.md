# Switch to Direct Supabase Connection

## Problem
The Transaction Pooler connection is failing with SSL errors:
```
SSL connection has been closed unexpectedly
```

## Solution: Use Direct Connection

### Step 1: Update Render Environment Variables

Go to: **Render Dashboard** → **green_eyes_backend** → **Environment** tab

**Change these 3 variables:**

| Variable | OLD Value (Pooler) | NEW Value (Direct) |
|----------|-------------------|-------------------|
| `DB_HOST` | `aws-1-ap-southeast-2.pooler.supabase.com` | `db.fhikehkuookglfjomxen.supabase.co` |
| `DB_PORT` | `6543` | `5432` |
| `DB_USER` | `postgres.fhikehkuookglfjomxen` | `postgres` |

**Keep these the same:**
- `DB_NAME` = `postgres`
- `DB_PASS` = `BnDgPKyYpjHCx9vy`

### Step 2: Click "Save Changes"

This will trigger an automatic redeploy.

### Step 3: Watch the Logs

Go to **Logs** tab and watch for:

**Success:**
```
[STARTUP] ✓ Database connection successful
[STARTUP] ✓ API Server is READY and HEALTHY
```

**If still fails:**
See "Plan B" below.

---

## Detailed Instructions

### How to Edit Each Variable

1. **DB_HOST:**
   - Find the `DB_HOST` row
   - Click the **edit** icon (pencil)
   - Change to: `db.fhikehkuookglfjomxen.supabase.co`
   - Click **Save**

2. **DB_PORT:**
   - Find the `DB_PORT` row
   - Click the **edit** icon
   - Change to: `5432`
   - Click **Save**

3. **DB_USER:**
   - Find the `DB_USER` row
   - Click the **edit** icon
   - Change to: `postgres` (remove `.fhikehkuookglfjomxen`)
   - Click **Save**

4. **Click "Save Changes"** button at the top

---

## Why This Works

**Pooler (Port 6543):**
- ❌ Long distance (Sydney → Virginia)
- ❌ SSL connection unstable
- ❌ Timeout issues

**Direct (Port 5432):**
- ✅ More reliable
- ✅ Better SSL handling
- ✅ Works despite distance

---

## Plan B: If Direct Connection Also Fails

If direct connection still fails, you have 2 options:

### Option B1: Create Render PostgreSQL (Recommended)

**Pros:**
- Same datacenter = instant connection
- More reliable
- No distance issues

**Steps:**
1. Render Dashboard → **New** → **PostgreSQL**
2. Name: `green_eyes_db`
3. Region: **Virginia (US East)** (same as backend)
4. Plan: **Free** (or paid if needed)
5. Click **Create Database**
6. Copy the **Internal Database URL**
7. Go to backend service → Environment
8. Add/Update:
   ```
   DATABASE_URL=<paste internal database URL>
   ```
9. Remove individual DB variables (or keep them, DATABASE_URL takes precedence)
10. Save and redeploy

### Option B2: Create New Supabase in US Region

**Steps:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project
3. Choose **US East (N. Virginia)** region
4. Wait for project to be created
5. Go to Settings → Database
6. Copy connection details
7. Update Render environment variables
8. Redeploy

---

## Quick Command to Test Connection

After changing variables, test from Render Shell:

```bash
# In Render Shell (if available)
python manage.py check --database default
```

---

## Expected Result

After switching to direct connection, you should see in logs:

```
[DB CONFIG] DB_HOST (host): db.fhikehkuookglfjomxen.supabase.co
[DB CONFIG] DB_PORT (port): 5432
[DB CONFIG] DB_USER (user): postgres
[STARTUP] Testing database connection...
[STARTUP] ✓ Database connection successful
[STARTUP] ✓ core_user table exists: 0 users
[STARTUP] ✓ API Server is READY and HEALTHY
```

---

## Summary

**RIGHT NOW:**
1. Go to Render → Backend → Environment
2. Change `DB_HOST` to `db.fhikehkuookglfjomxen.supabase.co`
3. Change `DB_PORT` to `5432`
4. Change `DB_USER` to `postgres`
5. Save
6. Watch logs

**IF THAT FAILS:**
- Use Render PostgreSQL (Option B1) - fastest and most reliable

Let me know what you see in the logs!

