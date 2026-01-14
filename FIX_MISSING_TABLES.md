# Fix: no such table: core_user

## The Problem

Error: `OperationalError: no such table: core_user`

This means:
- ✅ Database is connected (otherwise you'd get connection error)
- ❌ Migrations haven't run yet
- ❌ Tables don't exist in the database

## Solution: Run Migrations

### Step 1: Check Pre-Deploy Command

1. Render Dashboard → **Backend Service** → **Settings** tab
2. Scroll to **"Pre-Deploy Command"**
3. It should be:
   ```
   python manage.py migrate --noinput
   ```
4. If it's different or empty, change it to the above

### Step 2: Trigger Manual Deploy

After setting/verifying pre-deploy command:

1. Render Dashboard → **Backend Service**
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Wait for deployment (2-3 minutes)
4. Watch the Logs - you should see:
   ```
   ==> Starting pre-deploy: python manage.py migrate --noinput
   ==> Running 'python manage.py migrate --noinput'
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     Applying core.0001_initial... OK
     ...
   ==> Pre-deploy complete!
   ```

### Step 3: Verify Tables Created

After migrations run, check:

1. Go to **Supabase Dashboard**
2. Click **"Table Editor"** in left sidebar
3. You should see tables like:
   - `core_user`
   - `core_profile`
   - `core_unit`
   - `auth_user` (Django default)
   - etc.

If tables exist, migrations worked! ✅

## Alternative: Run Migrations Manually (If Pre-Deploy Doesn't Work)

If pre-deploy command doesn't work, you can run migrations manually:

1. Render Dashboard → **Backend Service** → **Shell** tab
2. Run:
   ```bash
   python manage.py migrate
   ```
3. Wait for it to complete
4. You should see:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     ...
   ```

## Important: Make Sure Database is Connected

Before migrations can run, verify database connection:

1. Render Dashboard → **Backend Service** → **Environment** tab
2. Make sure you have:
   ```
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASS=i52hd1FMm3mnwJVX
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   ```

## After Migrations Run

Once migrations complete:

1. ✅ Tables will be created
2. ✅ You can request OTP (no more "no such table" error)
3. ✅ You can create users, login, etc.

## Summary

**The error:** `no such table: core_user`
**The cause:** Migrations haven't run
**The fix:** 
1. Verify pre-deploy command: `python manage.py migrate --noinput`
2. Trigger manual deploy
3. Or run migrations manually via Shell

After this, your app should work! 🎉


