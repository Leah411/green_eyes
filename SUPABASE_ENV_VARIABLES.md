# Supabase Environment Variables for Render

## Required Database Environment Variables

In **Render Dashboard** → **Backend Service** → **Environment** tab, add these 5 variables:

### 1. DB_NAME
```
DB_NAME=postgres
```
**Value:** Usually `postgres` (default Supabase database name)

### 2. DB_USER
```
DB_USER=postgres
```
**Value:** Usually `postgres` (default Supabase user)

### 3. DB_PASS
```
DB_PASS=i52hd1FMm3mnwJVX
```
**Value:** Your Supabase database password (you already have this: `i52hd1FMm3mnwJVX`)

### 4. DB_HOST
```
DB_HOST=db.your-project-ref.supabase.co
```
**Value:** Your Supabase host (get from Supabase Dashboard)

### 5. DB_PORT
```
DB_PORT=5432
```
**Value:** Usually `5432` (default PostgreSQL port)

---

## How to Get These Values from Supabase

1. **Go to [Supabase Dashboard](https://app.supabase.com)**
2. **Select your project**
3. **Go to Settings** → **Database**
4. **Scroll to "Connection string" section**
5. **Copy the connection string** (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Extract Values from Connection String

**Example connection string:**
```
postgresql://postgres:i52hd1FMm3mnwJVX@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Extracted values:**
- `DB_NAME` = `postgres` (after the last `/`)
- `DB_USER` = `postgres` (before the first `:`)
- `DB_PASS` = `i52hd1FMm3mnwJVX` (between `:` and `@`)
- `DB_HOST` = `db.abcdefghijklmnop.supabase.co` (between `@` and `:5432`)
- `DB_PORT` = `5432` (between `:` and `/`)

---

## Complete Example

Based on your password, here's what you need (you still need `DB_HOST`):

```
DB_NAME=postgres
DB_USER=postgres
DB_PASS=i52hd1FMm3mnwJVX
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
```

**Replace `db.your-project-ref.supabase.co`** with your actual Supabase host!

---

## How to Set in Render

1. **Render Dashboard** → **Backend Service** → **Environment** tab
2. **Click "Add Environment Variable"** for each one
3. **Enter:**
   - **Key:** `DB_NAME`
   - **Value:** `postgres`
4. **Click "Save Changes"**
5. **Repeat for all 5 variables**

---

## Important Notes

1. **No spaces** around the `=` sign
2. **No quotes** around values (unless value contains spaces)
3. **Case sensitive** - variable names must match exactly
4. **Save after each change** - Render will redeploy automatically
5. **Environment variables override `render.yaml`** - So you can set Supabase even though `render.yaml` says Render PostgreSQL

---

## Quick Checklist

- [ ] `DB_NAME=postgres`
- [ ] `DB_USER=postgres`
- [ ] `DB_PASS=i52hd1FMm3mnwJVX` ✅ (you have this)
- [ ] `DB_HOST=db.your-project-ref.supabase.co` ⚠️ (need this from Supabase!)
- [ ] `DB_PORT=5432`

---

## How to Get DB_HOST

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection string** section
3. **Copy the connection string**
4. **Find the part between `@` and `:5432`**
5. **That's your `DB_HOST`!**

**Example:**
- Connection string: `postgresql://postgres:pass@db.abc123.supabase.co:5432/postgres`
- `DB_HOST` = `db.abc123.supabase.co`

---

## After Setting Variables

1. **Save all variables**
2. **Render will automatically redeploy** (2-3 minutes)
3. **Check Logs** - should see migrations running
4. **Verify connection** - check if tables exist in Supabase

---

## Troubleshooting

### If connection fails:

1. **Check `DB_HOST`** - must match Supabase exactly
2. **Check `DB_PASS`** - must be correct password
3. **Check Supabase project** - is it active (not paused)?
4. **Check Logs** - look for connection errors

### Common errors:

- `could not connect to server` → Wrong `DB_HOST` or Supabase paused
- `authentication failed` → Wrong `DB_PASS` or `DB_USER`
- `no such table` → Connected but migrations not run

---

## Summary

**You need 5 environment variables:**
1. `DB_NAME=postgres`
2. `DB_USER=postgres`
3. `DB_PASS=i52hd1FMm3mnwJVX` ✅
4. `DB_HOST=db.your-project-ref.supabase.co` ⚠️ (get from Supabase)
5. `DB_PORT=5432`

**Get `DB_HOST` from Supabase Dashboard → Settings → Database → Connection string**

Do you have the `DB_HOST` from Supabase? If not, I can help you find it!

