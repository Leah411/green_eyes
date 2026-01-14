# How to Check if Database is Connected

## Method 1: Check Render Logs (Easiest)

1. **Render Dashboard** → **Backend Service** → **Logs** tab
2. Look for migration messages:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     ...
   ```
   ✅ **If you see this** = Database is connected!

3. Look for errors:
   - ❌ `could not connect to server` = Not connected
   - ❌ `authentication failed` = Wrong credentials
   - ❌ `no such table` = Connected but migrations not run

## Method 2: Check Health Endpoint

Visit in browser:
```
https://green-eyes-uaw4.onrender.com/api/health/
```

**If it returns:**
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```
✅ **App is running** (but doesn't guarantee DB connection)

**If it returns error:**
❌ **App might not be running or DB not connected**

## Method 3: Check Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"Table Editor"** in left sidebar
4. **If you see tables** like:
   - `core_user`
   - `core_profile`
   - `core_unit`
   - `auth_user` (if exists)
   - etc.
   ✅ **Database is connected and migrations ran!**

**If tables don't exist:**
- Database might be connected but migrations didn't run
- Or database is not connected

## Method 4: Use Render Shell (Most Reliable)

1. **Render Dashboard** → **Backend Service** → **Shell** tab
2. Run:
   ```bash
   python manage.py shell
   ```
3. Then in Python shell:
   ```python
   from django.db import connection
   from core.models import User
   
   # Test connection
   try:
       connection.ensure_connection()
       print("✅ Database connection: OK")
   except Exception as e:
       print(f"❌ Database connection failed: {e}")
   
   # Try to query
   try:
       count = User.objects.count()
       print(f"✅ Database query works! Found {count} users")
   except Exception as e:
       print(f"❌ Database query failed: {e}")
   ```

**Expected output:**
```
✅ Database connection: OK
✅ Database query works! Found 0 users
```

## Method 5: Check Environment Variables

1. **Render Dashboard** → **Backend Service** → **Environment** tab
2. Verify you have all 5 database variables:
   - ✅ `DB_NAME=postgres`
   - ✅ `DB_USER=postgres`
   - ✅ `DB_PASS=i52hd1FMm3mnwJVX` (your password)
   - ✅ `DB_HOST=db.your-project-ref.supabase.co`
   - ✅ `DB_PORT=5432`

**If any are missing:**
❌ **Database won't connect**

## Method 6: Test Connection via Python Script

Create a test script:

1. **Render Dashboard** → **Backend Service** → **Shell**
2. Run:
   ```bash
   python manage.py shell
   ```
3. Then:
   ```python
   from django.db import connection
   from django.conf import settings
   
   # Print connection settings (hide password)
   print("Database Settings:")
   print(f"  DB_NAME: {settings.DATABASES['default']['NAME']}")
   print(f"  DB_USER: {settings.DATABASES['default']['USER']}")
   print(f"  DB_HOST: {settings.DATABASES['default']['HOST']}")
   print(f"  DB_PORT: {settings.DATABASES['default']['PORT']}")
   print(f"  DB_PASS: {'*' * len(settings.DATABASES['default']['PASSWORD'])}")
   
   # Test connection
   try:
       with connection.cursor() as cursor:
           cursor.execute("SELECT 1")
           result = cursor.fetchone()
           print(f"\n✅ Database connection: SUCCESS")
           print(f"   Test query result: {result}")
   except Exception as e:
       print(f"\n❌ Database connection: FAILED")
       print(f"   Error: {e}")
   ```

## Method 7: Check Backend Logs for Database Errors

1. **Render Dashboard** → **Backend Service** → **Logs** tab
2. Look for recent errors:
   - `OperationalError`
   - `could not connect to server`
   - `authentication failed`
   - `relation does not exist`

**If you see these errors:**
❌ **Database connection issue**

## Quick Checklist

- [ ] Environment variables set (all 5 DB variables)
- [ ] Migrations ran successfully (check Logs)
- [ ] Tables exist in Supabase (check Table Editor)
- [ ] Health endpoint returns 200 OK
- [ ] No database errors in Logs

## Common Issues

### Issue 1: "could not connect to server"
**Causes:**
- Wrong `DB_HOST`
- Supabase project paused
- Firewall blocking

**Solutions:**
- ✅ Check `DB_HOST` matches Supabase connection string
- ✅ Verify Supabase project is active
- ✅ Check Supabase dashboard → Settings → Database

### Issue 2: "authentication failed"
**Causes:**
- Wrong `DB_PASS`
- Wrong `DB_USER`

**Solutions:**
- ✅ Double-check password in Supabase
- ✅ Verify `DB_USER=postgres`
- ✅ No extra spaces in environment variables

### Issue 3: "no such table"
**Causes:**
- Database connected but migrations not run

**Solutions:**
- ✅ Run migrations: `python manage.py migrate`
- ✅ Check if migrations ran in Logs

## Summary

**Easiest method:** Check Supabase Table Editor - if tables exist, DB is connected! ✅

**Most reliable method:** Use Render Shell to test connection directly

**Quick check:** Look at Render Logs for migration messages or errors

What do you see when you check? Let me know and I can help troubleshoot!

