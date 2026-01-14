# How to View Logs in Render

## Step-by-Step Guide

### 1. Go to Render Dashboard

1. Open [Render Dashboard](https://dashboard.render.com)
2. Sign in if needed

### 2. Find Your Backend Service

1. You should see a list of your services
2. Find your **Backend Service** (probably named `green_eyes_backend` or `yirok-django`)
3. Click on it

### 3. Open Logs Tab

1. At the top of the service page, you'll see tabs:
   - **Overview**
   - **Logs** ← Click this!
   - **Events**
   - **Environment**
   - **Settings**
   - etc.

2. Click **"Logs"** tab

### 4. View Logs

You'll see:
- **Real-time logs** - updates automatically
- **Scrollable** - scroll up/down to see history
- **Searchable** - use Ctrl+F (or Cmd+F on Mac) to search
- **Color-coded** - errors in red, info in white/gray

## What You'll See in Logs

### During Build:
```
==> Building...
==> Installing dependencies...
Successfully installed Django-6.0.1 ...
```

### During Pre-Deploy:
```
==> Starting pre-deploy: python manage.py migrate --noinput
==> Running 'python manage.py migrate --noinput'
Database configured: postgres@db.xxxxx.supabase.co:6543/postgres (SSL required)
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, core, sessions
Running migrations:
  Applying contenttypes.0001_initial... OK
  ...
==> Pre-deploy complete!
```

### During Runtime:
```
Database configured: postgres@db.xxxxx.supabase.co:6543/postgres (SSL required)
Health check: Database connection OK
Health check: Tables OK, 0 users found
```

### If There Are Errors:
```
ERROR: connection to server at "db.xxxxx.supabase.co" failed: Network is unreachable
ERROR: Health check: Database connection failed: ...
```

## How to Filter Logs

### Search for Specific Terms:
1. Press **Ctrl+F** (Windows) or **Cmd+F** (Mac)
2. Type what you're looking for:
   - `error` - find all errors
   - `database` - find database-related logs
   - `migration` - find migration logs
   - `SSL` - find SSL-related logs

### Look for Specific Time:
- Logs show timestamps
- Scroll to find logs from specific time

## Log Levels

- **INFO** - General information (white/gray)
- **WARNING** - Warnings (yellow)
- **ERROR** - Errors (red)
- **DEBUG** - Debug messages (if DEBUG=True)

## Real-Time vs Historical

- **Real-time**: Logs update automatically as they happen
- **Historical**: Scroll up to see older logs
- **Auto-refresh**: Logs refresh automatically

## Tips

1. **Keep Logs Open**: Leave the Logs tab open during deploy to see what's happening
2. **Scroll to Bottom**: New logs appear at the bottom
3. **Search is Your Friend**: Use Ctrl+F to find specific errors
4. **Check Timestamps**: Look at the time to see when things happened

## What to Look For After Your Changes

After the latest deploy, look for:

1. **Database Configuration:**
   ```
   Database configured: postgres@db.fhikehkuookglfjomxen.supabase.co:6543/postgres (SSL required)
   ```

2. **Connection Success:**
   ```
   Health check: Database connection OK
   ```

3. **Or Connection Errors:**
   ```
   ERROR: connection to server failed: ...
   ```

4. **Migration Status:**
   ```
   Running migrations:
     Applying ... OK
   ```

## If You Don't See Logs

1. **Check Service Status**: Is the service running?
2. **Refresh Page**: Sometimes you need to refresh
3. **Check Events Tab**: Look at Events tab for deployment history
4. **Wait a Moment**: Logs might take a few seconds to appear

## Summary

**Where:** Render Dashboard → Your Backend Service → **Logs** tab

**What to look for:**
- Database configuration messages
- Connection success/errors
- Migration status
- Health check results

**Pro tip:** Keep the Logs tab open during deploy to see everything in real-time!

