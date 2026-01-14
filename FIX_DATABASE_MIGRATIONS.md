# Fix: Migrations Running Multiple Times

## The Problem

You're seeing migrations run repeatedly because:
1. Migrations are in `buildCommand` in `render.yaml`
2. Migrations are also in `pre-deploy` command in Render Dashboard
3. This causes them to run twice (or more)

## Solution 1: Remove Migrations from Build Command

I've already updated `render.yaml` to remove migrations from build command. Now migrations should only run in pre-deploy.

**What changed:**
- **Before**: `buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- **After**: `buildCommand: pip install -r requirements.txt && python manage.py collectstatic --noinput`

## Solution 2: Configure Supabase (Not Render PostgreSQL)

Your `render.yaml` is configured for Render's PostgreSQL, but you're using Supabase. You need to:

### Option A: Override in Render Dashboard (Recommended)

1. **Render Dashboard** → **Backend Service** → **Environment** tab
2. **Remove or ignore** the database variables from `render.yaml`
3. **Add manually** your Supabase credentials:

```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-supabase-password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
```

**Important:** Environment variables in Render Dashboard override `render.yaml`, so this will work!

### Option B: Update render.yaml (If using Blueprint)

If you want to use Supabase in `render.yaml`, you need to change it from:
```yaml
- key: DB_NAME
  fromDatabase:
    name: yirok-postgres
    property: database
```

To:
```yaml
- key: DB_NAME
  sync: false  # You'll set this manually
```

But **Option A is easier** - just set them in Render Dashboard!

## What to Do Now

1. ✅ **I've already fixed** `render.yaml` (removed migrations from build)
2. ✅ **Commit and push** the change:
   ```powershell
   git add render.yaml
   git commit -m "Remove migrations from build command - run only in pre-deploy"
   git push
   ```

3. ✅ **Set Supabase credentials** in Render Dashboard:
   - Backend Service → Environment
   - Add/Update:
     - `DB_NAME=postgres`
     - `DB_USER=postgres`
     - `DB_PASS=your-supabase-password`
     - `DB_HOST=db.your-project-ref.supabase.co`
     - `DB_PORT=5432` 

4. ✅ **Verify pre-deploy command** in Render Dashboard:
   - Backend Service → Settings
   - Pre-Deploy Command should be: `python manage.py migrate --noinput`
   - (This is correct - keep it!)

## After Fixing

After you push the `render.yaml` change and set Supabase credentials:

1. Render will redeploy automatically
2. Migrations will run **once** in pre-deploy (not in build)
3. You should see in Logs:
   ```
   ==> Starting pre-deploy: python manage.py migrate --noinput
   ==> Running 'python manage.py migrate --noinput'
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     ...
   ==> Pre-deploy complete!
   ```

## Summary

- ✅ Removed migrations from `buildCommand` in `render.yaml`
- ⏳ You need to: Commit and push this change
- ⏳ You need to: Set Supabase credentials in Render Dashboard
- ✅ Pre-deploy command is correct (keep it as is)

After this, migrations will run only once per deployment! 🎉


