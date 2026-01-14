# Render Database Link vs Supabase

## What is "Datastore Link" in Render?

In Render Dashboard, when you create a **PostgreSQL database service**, you can "link" it to your web service. This automatically sets the database environment variables (`DB_NAME`, `DB_USER`, `DB_PASS`, etc.) for you.

## Your Situation

You're using **Supabase** (not Render's PostgreSQL), so you **don't need** to link a Render database.

## Two Options

### Option 1: Use Supabase (What You're Doing Now) ✅

**You DON'T need to link anything.**

Just set the environment variables manually:
- `DB_NAME=postgres`
- `DB_USER=postgres`
- `DB_PASS=your-supabase-password`
- `DB_HOST=db.your-project-ref.supabase.co`
- `DB_PORT=5432`

**Where to set:**
- Render Dashboard → Backend Service → **Environment** tab
- Add these variables manually

### Option 2: Use Render's PostgreSQL (Alternative)

If you want to use Render's PostgreSQL instead of Supabase:

1. **Create a PostgreSQL database in Render:**
   - Render Dashboard → **New +** → **PostgreSQL**
   - Name it (e.g., `yirok-postgres`)
   - Choose region and plan
   - Click **"Create Database"**

2. **Link it to your Backend Service:**
   - Go to your Backend Service
   - **Settings** tab
   - Scroll to **"Connections"** section
   - Click **"Connect"** next to your PostgreSQL database
   - Render will automatically set `DB_*` variables

3. **Remove Supabase variables:**
   - Go to **Environment** tab
   - Delete the Supabase `DB_*` variables (they'll be replaced by Render's)

## Current Setup in render.yaml

Your `render.yaml` is configured for Render PostgreSQL:
```yaml
- key: DB_NAME
  fromDatabase:
    name: yirok-postgres
    property: database
```

But since you're using Supabase, you need to **override** these in Render Dashboard.

## What to Do

### If Using Supabase (Recommended for you):

1. **Ignore** the database link option in Render
2. **Don't create** a Render PostgreSQL database
3. **Set Supabase variables manually** in Environment tab:
   ```
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASS=your-supabase-password
   DB_HOST=db.your-project-ref.supabase.co
   DB_PORT=5432
   ```

### If You Want to Switch to Render PostgreSQL:

1. Create PostgreSQL database in Render
2. Link it to your Backend Service
3. Remove Supabase variables
4. Render will auto-set the database variables

## Summary

- **"Datastore Link"** = Connect Render's PostgreSQL to your service
- **You're using Supabase** = No need to link, just set variables manually
- **Environment variables override `render.yaml`** = Your manual Supabase settings will work

**Bottom line:** You don't need to link anything. Just set the Supabase environment variables manually in the Environment tab! ✅


