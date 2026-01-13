# Supabase Connection Timeout Issue

## Error
```
connection to server at "aws-1-ap-southeast-2.pooler.supabase.com" (13.239.87.90), port 6543 failed: timeout expired
```

## Problem
The connection is timing out, which means:
- Network connectivity issue between Render (US East - Virginia) and Supabase (AP Southeast 2 - Sydney)
- Distance/latency is too high
- Supabase pooler might be having issues

## Solutions to Try

### Solution 1: Use Direct Connection Instead of Pooler

Since the pooler is timing out, try the direct connection:

**In Render Environment Variables, change:**
```bash
# Instead of pooler:
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=6543

# Use direct connection:
DB_HOST=db.fhikehkuookglfjomxen.supabase.co
DB_PORT=5432
```

**Note:** Direct connection might have IPv6 issues, but it's worth trying if pooler times out.

### Solution 2: Use Session Mode Instead of Transaction Mode

If you're using transaction pooling mode, try session mode:

1. Go to Supabase Dashboard
2. Settings → Database → Connection Pooling
3. Switch from "Transaction" to "Session" mode
4. Use port 6543 with session mode

### Solution 3: Check Supabase Region

Your Supabase project is in `ap-southeast-2` (Sydney, Australia).
Render backend is in `us-east` (Virginia, USA).

This is a ~10,000 mile distance which can cause high latency and timeouts.

**Options:**
1. **Move Supabase to US region** (recommended if starting fresh)
   - Create new Supabase project in `us-east-1` (closer to Render)
   - Migrate data if needed

2. **Move Render to AP Southeast** (if you need data in Australia)
   - Change Render region to Singapore (closest to Sydney)

3. **Use direct connection** (bypass pooler entirely)

### Solution 4: Increase Timeout (Already Done)

I've increased the connection timeout from 10 to 30 seconds in the latest commit.

This might help if it's just slow, but won't fix if the connection is blocked.

---

## Recommended Action Plan

### Option A: Try Direct Connection (Quick Fix)

1. Go to Render Dashboard → green_eyes_backend → Environment
2. Change these variables:
   ```bash
   DB_HOST=db.fhikehkuookglfjomxen.supabase.co
   DB_PORT=5432
   DB_USER=postgres
   ```
   Note: User changes from `postgres.PROJECT_REF` to just `postgres` for direct connection

3. Redeploy

### Option B: Move to US-Based Database (Best Long-Term)

If you don't need data in Australia:

**Option B1: New Supabase Project in US**
1. Create new Supabase project in us-east-1 region
2. Get new connection details
3. Update Render env vars
4. Run migrations

**Option B2: Use Render PostgreSQL**
1. Create PostgreSQL database in Render (same region as backend)
2. Update env vars with Render DB credentials
3. Run migrations

### Option C: Test Both Connection Methods

Let's test which connection works:

**Test 1: Direct Connection (Port 5432)**
```bash
DB_HOST=db.fhikehkuookglfjomxen.supabase.co
DB_PORT=5432
DB_USER=postgres
```

**Test 2: Transaction Pooler (Port 6543)**
```bash
DB_HOST=aws-1-ap-southeast-2.pooler.supabase.com
DB_PORT=6543
DB_USER=postgres.fhikehkuookglfjomxen
```

**Test 3: Session Pooler (Port 5432 with pooler)**
Check Supabase docs for session pooler port (might be different)

---

## Quick Decision Matrix

| Scenario | Best Option |
|----------|-------------|
| **Need data in Australia** | Try direct connection OR move Render to Singapore region |
| **Don't care about data location** | Create new Supabase in US region |
| **Need quick fix now** | Try direct connection (DB_PORT=5432, DB_HOST=db.xxx.supabase.co) |
| **Want zero config** | Use Render's built-in PostgreSQL |

---

## Immediate Next Steps

1. **Try direct connection** - Change to port 5432 and direct host
2. **Check Supabase status** - Go to status.supabase.com
3. **Consider region change** - If timeouts persist, database needs to be closer to Render

Let me know which option you want to try!

