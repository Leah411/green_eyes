# How to Run Migrations on Render

## Option 1: Manual Deploy (If Available)

The Manual Deploy button should be at the top of your service page:
- Look for a button that says **"Manual Deploy"** or **"Deploy"**
- It might be in the top right corner
- Or in a dropdown menu

If you can't find it, try the other options below.

## Option 2: Trigger Deploy by Pushing Code

The easiest way to trigger a deploy (which will run migrations):

1. Make a small change to any file (or just add a comment)
2. Commit and push:
   ```powershell
   git add .
   git commit -m "Trigger deploy to run migrations"
   git push
   ```
3. Render will automatically detect the push and deploy
4. Migrations will run in pre-deploy

## Option 3: Use Render Shell (Run Migrations Manually)

1. Render Dashboard → **Backend Service**
2. Look for **"Shell"** tab (next to Logs, Environment, etc.)
3. Click **"Shell"** or **"Open Shell"**
4. Run:
   ```bash
   python manage.py migrate
   ```
5. Wait for it to complete
6. You should see:
   ```
   Operations to perform:
     Apply all migrations: admin, auth, contenttypes, core, sessions
   Running migrations:
     Applying contenttypes.0001_initial... OK
     Applying auth.0001_initial... OK
     ...
   ```

## Option 4: Check if Deploy Hook Works

You have a Deploy Hook URL:
```
https://api.render.com/deploy/srv-d5hpoa56ubrc73860oig?key=o8onwC56CvQ
```

You can trigger a deploy by visiting this URL in your browser (or using curl):
```powershell
Invoke-WebRequest -Uri "https://api.render.com/deploy/srv-d5hpoa56ubrc73860oig?key=o8onwC56CvQ"
```

This will trigger a new deployment!

## Option 5: Make a Small Code Change

1. Open any file (like `yirok_project/settings.py`)
2. Add a comment at the top:
   ```python
   # Trigger deploy
   ```
3. Save and commit:
   ```powershell
   git add yirok_project/settings.py
   git commit -m "Trigger deploy"
   git push
   ```
4. Render will auto-deploy

## Recommended: Use Shell (Option 3)

The fastest way is to use Render Shell:
1. Backend Service → **Shell** tab
2. Run: `python manage.py migrate`
3. Done!

This runs migrations immediately without waiting for a full deploy.

## After Migrations Run

Check if it worked:
1. Try requesting OTP again
2. The "no such table" error should be gone
3. Or check Supabase Dashboard → Table Editor - you should see tables


