# Fix: 400 Bad Request Error

## The Problem

Error: `400 Bad Request` when requesting OTP

This is **better** than 500! It means:
- ✅ Database is connected
- ✅ Migrations ran successfully
- ✅ Tables exist
- ❌ But there's a validation error

## Common Causes

### Cause 1: User Not Approved (Most Likely)

The user exists in database but `is_approved = False`.

**Check in Supabase:**
1. Go to Supabase Dashboard
2. Click **"Table Editor"**
3. Open `core_user` table
4. Find your user
5. Check the `is_approved` column - is it `true` or `false`?

**If `is_approved = false`:**
- You need to approve the user
- Or set it to `true` manually in Supabase

### Cause 2: Email Format Issue

The email might not be in the correct format.

**Check:**
- Is the email valid? (e.g., `user@example.com`)
- No extra spaces?
- Correct format?

### Cause 3: User Doesn't Exist

Even though you said the user exists, double-check:
- Is the email exactly the same?
- Case sensitive? (usually not, but check)

## How to See the Exact Error

### In Browser Network Tab:

1. Open Frontend: `https://green-eyes-frontend.onrender.com`
2. Press **F12** → **Network** tab
3. Try requesting OTP
4. Click on the `request-otp` request
5. Go to **Response** tab
6. You'll see the exact error message

The error will look like:
```json
{
  "email": ["User account is not approved yet."]
}
```

Or:
```json
{
  "email": ["User with this email does not exist."]
}
```

## Solutions

### Solution 1: Approve User in Supabase

1. Go to Supabase Dashboard
2. **Table Editor** → `core_user` table
3. Find your user
4. Click to edit
5. Set `is_approved` to `true`
6. Save

### Solution 2: Approve User via Admin Panel

1. Go to: `https://green-eyes-uaw4.onrender.com/admin/`
2. Login with admin credentials
3. Go to **Users** → Find your user
4. Check **"Is approved"** checkbox
5. Save

### Solution 3: Create Admin User and Approve

If you don't have admin access:

1. Use Render Shell:
   ```bash
   python manage.py createsuperuser
   ```
2. Login to admin panel
3. Approve users

## Quick Check: What's the Exact Error?

To fix this properly, I need to know the exact error message from the Response.

**Check Response tab in Network** - what does it say?

Common messages:
- `"User account is not approved yet."` → Need to approve user
- `"User with this email does not exist."` → User doesn't exist
- `"Enter a valid email address."` → Email format issue

## Summary

**The error:** 400 Bad Request
**Most likely cause:** User not approved (`is_approved = false`)
**Quick fix:** Set `is_approved = true` in Supabase or Admin panel

What's the exact error message in the Response tab?


