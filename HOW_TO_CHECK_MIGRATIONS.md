# How to Check Migrations Status

## Method 1: Check Render Logs (Easiest)

1. **Render Dashboard** → **Backend Service** → **Logs** tab
2. Scroll down and look for migration messages
3. **If migrations ran successfully**, you'll see:
   ```
   ==> Starting pre-deploy: python manage.py migrate --noinput
   ==> Running 'python manage.py migrate --noinput'
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     Applying core.0001_initial... OK
     Applying sessions.0001_initial... OK
   ==> Pre-deploy complete!
   ```
   ✅ **This means migrations ran successfully!**

4. **If migrations failed**, you'll see errors like:
   ```
   django.db.utils.OperationalError: could not connect to server
   ```
   ❌ **Database connection issue**

## Method 2: Use Django Showmigrations Command

1. **Render Dashboard** → **Backend Service** → **Shell** tab
2. Run:
   ```bash
   python manage.py showmigrations
   ```
3. **Output will show:**
   ```
   admin
    [X] 0001_initial
    [X] 0002_logentry_remove_auto_add
    ...
   auth
    [X] 0001_initial
    ...
   core
    [X] 0001_initial
    [X] 0002_...
    ...
   ```
   - `[X]` = Migration applied ✅
   - `[ ]` = Migration not applied ❌

## Method 3: Check Supabase Tables

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **"Table Editor"** in left sidebar
4. **If migrations ran**, you should see tables like:
   - ✅ `core_user`
   - ✅ `core_profile`
   - ✅ `core_unit`
   - ✅ `core_location`
   - ✅ `core_otptoken`
   - ✅ `core_accessrequest`
   - ✅ `core_availabilityreport`
   - ✅ `django_migrations` (Django's migration tracking table)
   - ✅ `auth_user` (if exists)
   - ✅ `django_session`
   - ✅ `django_content_type`
   - etc.

**If tables don't exist:**
❌ **Migrations haven't run yet**

## Method 4: Check Migration Status via Python

1. **Render Dashboard** → **Backend Service** → **Shell**
2. Run:
   ```bash
   python manage.py shell
   ```
3. Then:
   ```python
   from django.db import connection
   from django.core.management import call_command
   import sys
   
   # Check if django_migrations table exists
   with connection.cursor() as cursor:
       cursor.execute("""
           SELECT table_name 
           FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = 'django_migrations'
       """)
       result = cursor.fetchone()
       if result:
           print("✅ django_migrations table exists")
           
           # Count applied migrations
           cursor.execute("SELECT COUNT(*) FROM django_migrations")
           count = cursor.fetchone()[0]
           print(f"✅ Found {count} applied migrations")
       else:
           print("❌ django_migrations table does not exist - migrations haven't run")
   
   # Check if core_user table exists
   with connection.cursor() as cursor:
       cursor.execute("""
           SELECT table_name 
           FROM information_schema.tables 
           WHERE table_schema = 'public' 
           AND table_name = 'core_user'
       """)
       result = cursor.fetchone()
       if result:
           print("✅ core_user table exists - migrations ran!")
       else:
           print("❌ core_user table does not exist - migrations haven't run")
   ```

## Method 5: Check Specific App Migrations

To check migrations for a specific app (e.g., `core`):

1. **Render Shell:**
   ```bash
   python manage.py showmigrations core
   ```
2. **Output:**
   ```
   core
    [X] 0001_initial
    [X] 0002_...
    [X] 0003_...
   ```
   - All `[X]` = All migrations applied ✅
   - Any `[ ]` = Some migrations not applied ❌

## Method 6: Check Migration Files vs Applied Migrations

1. **Render Shell:**
   ```bash
   python manage.py shell
   ```
2. Then:
   ```python
   from django.db.migrations.recorder import MigrationRecorder
   from django.apps import apps
   
   # Get all migration files
   app_config = apps.get_app_config('core')
   migration_files = []
   for migration in app_config.get_migrations():
       migration_files.append(migration.name)
   
   print(f"Migration files found: {len(migration_files)}")
   print(f"Files: {migration_files}")
   
   # Get applied migrations from database
   recorder = MigrationRecorder(connection)
   applied = recorder.applied_migrations()
   applied_core = [m for m in applied if m[0] == 'core']
   
   print(f"\nApplied migrations: {len(applied_core)}")
   print(f"Applied: {[m[1] for m in applied_core]}")
   
   # Compare
   if len(migration_files) == len(applied_core):
       print("\n✅ All migrations applied!")
   else:
       print(f"\n❌ Missing {len(migration_files) - len(applied_core)} migrations")
   ```

## Method 7: Check Pre-Deploy Command

1. **Render Dashboard** → **Backend Service** → **Settings** tab
2. Scroll to **"Pre-Deploy Command"**
3. Should be:
   ```
   python manage.py migrate --noinput
   ```
4. **If it's different or empty:**
   - Change it to the above
   - Trigger a new deploy

## Quick Checklist

- [ ] Pre-deploy command is set: `python manage.py migrate --noinput`
- [ ] Migration messages appear in Logs
- [ ] Tables exist in Supabase (check Table Editor)
- [ ] `showmigrations` shows all `[X]` (applied)
- [ ] No migration errors in Logs

## Common Issues

### Issue 1: Migrations Not Running

**Symptoms:**
- No migration messages in Logs
- Tables don't exist in Supabase
- `showmigrations` shows `[ ]` (not applied)

**Solutions:**
1. ✅ Check Pre-Deploy Command is set
2. ✅ Trigger manual deploy
3. ✅ Or run migrations manually: `python manage.py migrate`

### Issue 2: Migrations Failed

**Symptoms:**
- Error messages in Logs
- `showmigrations` shows some `[ ]` (not applied)

**Common errors:**
- `could not connect to server` → Database not connected
- `relation already exists` → Migration already applied (can ignore)
- `no such table` → Previous migration didn't run

**Solutions:**
1. ✅ Check database connection
2. ✅ Check environment variables
3. ✅ Run migrations manually: `python manage.py migrate`

### Issue 3: Some Migrations Applied, Some Not

**Symptoms:**
- `showmigrations` shows mix of `[X]` and `[ ]`

**Solutions:**
1. ✅ Run migrations: `python manage.py migrate`
2. ✅ Check for errors in Logs
3. ✅ If stuck, you might need to fake migrations (advanced)

## Summary

**Easiest method:** Check Supabase Table Editor - if tables exist, migrations ran! ✅

**Most detailed:** Use `python manage.py showmigrations` in Shell

**Quick check:** Look at Render Logs for migration messages

## What to Do If Migrations Haven't Run

1. **Check Pre-Deploy Command:**
   - Should be: `python manage.py migrate --noinput`

2. **Run Migrations Manually:**
   ```bash
   python manage.py migrate
   ```

3. **Or Trigger Deploy:**
   - Make a small code change and push
   - Or use Deploy Hook URL

What do you see when you check? Let me know and I can help!

