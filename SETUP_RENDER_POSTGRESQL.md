# Setup Render PostgreSQL Database

## Why Render PostgreSQL?

Your current issue:
- Supabase is in Australia (Sydney)
- Render backend is in USA (Virginia)
- Distance = ~10,000 miles = connection problems

**Solution:** Use Render's PostgreSQL in the same datacenter as your backend.

**Benefits:**
- ✅ Same datacenter = instant connection (< 1ms latency)
- ✅ No IPv6 issues
- ✅ No distance/timeout issues
- ✅ Free tier available
- ✅ Automatic backups
- ✅ Zero configuration needed

---

## Step 1: Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button (top right)
3. Select **"PostgreSQL"**

**Configure:**
- **Name**: `green-eyes-db`
- **Database**: `green_eyes` (or leave default)
- **User**: `green_eyes_user` (or leave default)
- **Region**: **Virginia (US East)** ⚠️ MUST match your backend service region
- **PostgreSQL Version**: 16 (latest)
- **Plan**: **Free** (or paid if you need more storage)

4. Click **"Create Database"**

**Wait:** 2-3 minutes for database to be created

---

## Step 2: Get Connection Details

Once the database is created:

1. Click on the database name (`green-eyes-db`)
2. You'll see connection information:

**Copy these values:**
- **Internal Database URL** (this is what you need!)
- It looks like: `postgresql://user:password@dpg-xxxxx-a/database_name`

**OR copy individual values:**
- **Hostname** (Internal)
- **Port** (usually 5432)
- **Database**
- **Username**
- **Password**

---

## Step 3: Update Backend Environment Variables

Go to: **green_eyes_backend** service → **Environment** tab

### Option A: Use DATABASE_URL (Recommended)

**Add or update:**
```
DATABASE_URL=postgresql://user:password@dpg-xxxxx-a/database_name
```

(Paste the **Internal Database URL** from Step 2)

### Option B: Use Individual Variables

**Update these variables:**
```
DB_NAME=green_eyes
DB_USER=green_eyes_user
DB_PASS=<password from Render>
DB_HOST=dpg-xxxxx-a.oregon-postgres.render.com
DB_PORT=5432
```

**Click "Save Changes"**

---

## Step 4: Run Migrations

After the backend redeploys:

### Option 4a: Migrations Will Run Automatically

The pre-deploy command runs migrations automatically:
```bash
python manage.py migrate --noinput
```

### Option 4b: Manual Migration (If Needed)

If you need to run manually:

1. Go to backend service
2. Click **"Shell"** tab
3. Run:
```bash
python manage.py migrate
```

---

## Step 5: Create Superuser (Optional)

To access Django admin:

1. Go to backend service → **Shell** tab
2. Run:
```bash
python manage.py createsuperuser
```

3. Follow prompts to create admin user

---

## Step 6: Verify Everything Works

### Check Logs

Go to **Logs** tab, you should see:

```
[STARTUP] ✓ Database connection successful
[STARTUP] Database Host: dpg-xxxxx-a.oregon-postgres.render.com
[STARTUP] ✓ core_user table exists: 0 users
[STARTUP] ✓ API Server is READY and HEALTHY
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

## Migration from Supabase (If You Had Data)

### If You Had No Data Yet
✅ You're done! Just use Render PostgreSQL from now on.

### If You Had Data in Supabase

You need to export from Supabase and import to Render:

**Export from Supabase:**
1. Supabase Dashboard → Database → Backups
2. Download latest backup
3. Or use `pg_dump`:
```bash
pg_dump -h db.fhikehkuookglfjomxen.supabase.co -U postgres -d postgres > backup.sql
```

**Import to Render:**
1. Get Render database External URL (from Render DB dashboard)
2. Use `psql`:
```bash
psql <EXTERNAL_DATABASE_URL> < backup.sql
```

---

## Troubleshooting

### Database creation stuck

Wait 5 minutes. If still stuck, delete and recreate.

### Can't connect after setup

**Check:**
1. Used **Internal Database URL** (not External)
2. Backend and database in same region
3. DATABASE_URL starts with `postgresql://` (not `postgres://`)

### Migrations fail

**Check logs for specific error, usually:**
- Wrong DATABASE_URL format
- Missing environment variable
- Database not ready yet (wait 1 minute)

---

## Cost

**Render PostgreSQL Free Tier:**
- 256 MB RAM
- 1 GB Disk
- Shared CPU
- **Good for:** Development, testing, small apps

**Need more?**
- Starter: $7/month (256 MB, 10 GB disk)
- Standard: $20/month (1 GB, 20 GB disk)

---

## Compare to Supabase

| Feature | Supabase (Australia) | Render PostgreSQL (Virginia) |
|---------|---------------------|------------------------------|
| Distance to Render Backend | ~10,000 miles ❌ | Same datacenter ✅ |
| Connection Latency | 200-300ms ❌ | < 1ms ✅ |
| IPv6 Issues | Yes ❌ | No ✅ |
| Timeout Issues | Yes ❌ | No ✅ |
| Free Tier | 500 MB ✅ | 1 GB ✅ |
| Backups | Automatic ✅ | Automatic ✅ |

**Winner:** Render PostgreSQL (for apps hosted on Render)

---

## Summary

**Right now:**
1. Create Render PostgreSQL database (2 minutes)
2. Copy Internal Database URL
3. Add `DATABASE_URL` to backend environment variables
4. Save and let it redeploy
5. Check logs for successful connection

**This will solve all your connection issues permanently!**

---

## Quick Start Command Summary

```bash
# After creating Render PostgreSQL:

# 1. Get DATABASE_URL from Render dashboard
# 2. Add to backend environment:
DATABASE_URL=postgresql://user:pass@dpg-xxxxx-a/dbname

# 3. Backend will auto-deploy and run:
python manage.py migrate --noinput

# 4. Check logs:
# [STARTUP] ✓ Database connection successful
```

Let me know when you've created the database and I'll help you configure it!

