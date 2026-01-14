# Fix: Supabase Connection Failed - Network is Unreachable

## The Problem

Error: `connection to server at "db.fhikehkuookglfjomxen.supabase.co" failed: Network is unreachable`

This means Render cannot connect to your Supabase database.

## Possible Causes

### 1. Supabase Project Paused

Free tier Supabase projects pause after inactivity.

**Check:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Check if your project shows "Paused" or needs to be resumed
3. If paused, click "Resume" or "Restore"

### 2. Using Direct Connection Instead of Pooler

Supabase recommends using **Connection Pooler** for serverless/server environments like Render.

**Direct connection:** `db.xxxxx.supabase.co:5432` (what you're using)
**Pooler connection:** `db.xxxxx.supabase.co:6543` (recommended for Render)

### 3. IPv6 Issue

The error shows it's trying IPv6: `(2406:da1c:f42:ae09:d870:c791:f437:53a6)`

Render might not support IPv6 connections to Supabase.

## Solutions

### Solution 1: Use Supabase Connection Pooler (Recommended)

1. **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **"Connection string"** section
3. Look for **"Connection pooling"** tab
4. Copy the **Pooler connection string** (port 6543, not 5432)
5. Extract the host - it should be the same but use port 6543

**Update in Render:**
- `DB_HOST=db.fhikehkuookglfjomxen.supabase.co` (same)
- `DB_PORT=6543` (change from 5432 to 6543)

### Solution 2: Check Supabase Project Status

1. **Supabase Dashboard** → Check project status
2. If paused, **Resume** it
3. Wait 1-2 minutes for it to start
4. Try deploy again

### Solution 3: Use Transaction Mode Pooler

Supabase has two pooler modes:
- **Session mode** (port 5432) - for direct connections
- **Transaction mode** (port 6543) - for serverless/server environments ✅

**Use Transaction mode for Render:**
- `DB_PORT=6543`

### Solution 4: Check Supabase Network Settings

1. **Supabase Dashboard** → **Settings** → **Database**
2. Check **"Network Restrictions"**
3. Make sure it's not blocking Render's IPs
4. If restricted, add Render's IP range or disable restrictions

## Quick Fix: Change Port to 6543

The easiest fix is to use the Connection Pooler:

**In Render Dashboard → Backend Service → Environment:**

Change:
```
DB_PORT=5432
```

To:
```
DB_PORT=6543
```

Keep everything else the same:
```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=i52hd1FMm3mnwJVX
DB_HOST=db.fhikehkuookglfjomxen.supabase.co
DB_PORT=6543
```

## Alternative: Make Migrations Optional in Pre-Deploy

If connection still fails, we can make migrations skip if DB is not available:

But this is **not recommended** - better to fix the connection.

## How to Get Pooler Connection String

1. **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **"Connection string"**
3. Click **"Connection pooling"** tab
4. Select **"Transaction"** mode
5. Copy the connection string
6. Extract values (same as before, but port is 6543)

## After Fixing

1. **Update `DB_PORT` to `6543`** in Render
2. **Save changes** - Render will redeploy
3. **Check Logs** - should connect successfully
4. **Migrations should run**

## Summary

**The issue:** Cannot connect to Supabase (Network unreachable)

**Most likely fix:** Use Connection Pooler (port 6543 instead of 5432)

**Quick fix:**
1. Render Dashboard → Environment
2. Change `DB_PORT=5432` to `DB_PORT=6543`
3. Save and redeploy

Try changing the port to 6543 first - this usually fixes it!

