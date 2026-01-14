# How to Check if Database is Connected

## Quick Check Methods

### Method 1: Check Render Logs (Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Open your **Backend Service**
3. Click **"Logs"** tab
4. Look for:
   - ✅ **Success**: `Operations to perform: Apply all migrations...` (means DB connected)
   - ❌ **Error**: `could not connect to server` or `authentication failed` (DB not connected)

### Method 2: Check Health Endpoint

Visit in browser:
```
https://green-eyes-uaw4.onrender.com/api/health/
```

If it returns:
```json
{"status":"healthy","timestamp":"...","version":"1.0.0"}
```
Then the app is running (but doesn't guarantee DB connection).

### Method 3: Check Backend Logs for Database Errors

In Render Dashboard → Backend Service → Logs, look for:
- `Applying migrations... OK` ✅ = DB connected
- `could not connect to server` ❌ = DB connection failed
- `authentication failed` ❌ = Wrong credentials
- `relation does not exist` ⚠️ = Connected but migrations not run

---

## For Supabase on Render

### Step 1: Get Your Supabase Connection Details

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **"Connection string"** section
5. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Step 2: Extract the Values

From the connection string, extract:
- **DB_HOST**: `db.xxxxx.supabase.co` (between `@` and `:5432`)
- **DB_NAME**: `postgres` (after the last `/`)
- **DB_USER**: `postgres` (before the first `:`)
- **DB_PASS**: Your password (between `:` and `@`)
- **DB_PORT**: `5432` (between `:` and `/`)

### Step 3: Set Environment Variables in Render

1. Render Dashboard → **Backend Service** → **Environment** tab
2. Add/Update these variables:

```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-supabase-password
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
```

**Important:**
- Replace `your-supabase-password` with your actual Supabase password
- Replace `db.your-project-ref.supabase.co` with your actual Supabase host
- No spaces around `=`
- No quotes around values

### Step 4: Verify Connection

After setting variables and redeploying:

1. Check **Logs** tab
2. Look for migration messages:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     ...
   ```
   ✅ If you see this, DB is connected!

---

## Common Issues

### Issue 1: "could not connect to server"

**Causes:**
- Wrong `DB_HOST`
- Supabase project paused
- Firewall blocking connection

**Solutions:**
- ✅ Check `DB_HOST` matches Supabase connection string
- ✅ Verify Supabase project is active (not paused)
- ✅ Check Supabase dashboard → Settings → Database → Connection string

### Issue 2: "authentication failed"

**Causes:**
- Wrong `DB_PASS`
- Wrong `DB_USER`
- Extra spaces in environment variables

**Solutions:**
- ✅ Double-check password in Supabase dashboard
- ✅ Verify `DB_USER` is exactly `postgres` (no spaces)
- ✅ Make sure no quotes around values in Render

### Issue 3: "relation does not exist"

**Causes:**
- Database connected but migrations not run
- Tables don't exist yet

**Solutions:**
- ✅ Check if migrations ran in Logs
- ✅ If not, they should run automatically on deploy
- ✅ Or run manually: `python manage.py migrate` (if you have shell access)

### Issue 4: Environment Variables Not Set

**Check:**
1. Render Dashboard → Backend Service → **Environment** tab
2. Verify all 5 database variables exist:
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
   - `DB_HOST`
   - `DB_PORT`

---

## Quick Test: Check if Tables Exist

If you want to verify the database has data:

1. Go to Supabase Dashboard
2. Click **"Table Editor"** in left sidebar
3. You should see tables like:
   - `core_user`
   - `core_profile`
   - `core_unit`
   - etc.

If tables exist, DB is connected and migrations ran! ✅

---

## Summary Checklist

- [ ] Supabase project is active (not paused)
- [ ] Got connection string from Supabase dashboard
- [ ] Extracted all 5 values (DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT)
- [ ] Set all 5 environment variables in Render
- [ ] Saved changes and waited for redeploy
- [ ] Checked Logs for migration messages
- [ ] Verified tables exist in Supabase dashboard

---

## If Still Not Working

Send me:
1. What error you see in Render Logs
2. Your Supabase connection string (hide the password!)
3. Which environment variables you have set in Render (hide passwords!)


