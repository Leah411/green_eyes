# Solutions: User Does Not Exist

## The Problem

Error: `"User with this email does not exist."`

This means the user is not in the `core_user` table in your Supabase database.

## Solution 1: Register User via API (Recommended)

Use the registration endpoint to create a new user:

### Via Frontend:
1. Go to your registration page (if you have one)
2. Fill in the form and register

### Via API Directly:

**URL:** `POST https://green-eyes-uaw4.onrender.com/api/auth/register/`

**Body (JSON):**
```json
{
  "email": "your-email@example.com",
  "first_name": "Your",
  "last_name": "Name",
  "phone": "+1234567890"
}
```

**Optional fields:**
- `username` (auto-generated from email if not provided)
- `password` (auto-generated if not provided - users use OTP to login)
- `unit_id` (if you have units)
- `role` (default: 'user')
- `address`, `city_id`, etc.

**Response:**
```json
{
  "message": "User created successfully. Waiting for admin approval.",
  "user_id": 1,
  "username": "your-email",
  "email": "your-email@example.com",
  "access_request_id": 1,
  "status": "pending"
}
```

**Note:** After registration, the user will be created with `is_approved = false`, so you'll need to approve them.

## Solution 2: Create User via Django Admin

1. **Create Admin User First:**
   - Render Dashboard → Backend Service → Shell
   - Run:
     ```bash
     python manage.py createsuperuser
     ```
   - Enter username, email, password

2. **Login to Admin:**
   - Go to: `https://green-eyes-uaw4.onrender.com/admin/`
   - Login with admin credentials

3. **Create User:**
   - Go to **Users** → **Add User**
   - Fill in details
   - **Important:** Check **"Is approved"** checkbox
   - Save

## Solution 3: Create User via Shell

1. Render Dashboard → Backend Service → Shell
2. Run:
   ```python
   python manage.py shell
   ```
3. Then in Python shell:
   ```python
   from core.models import User
   
   user = User.objects.create_user(
       username='testuser',
       email='your-email@example.com',
       password='temp-password-123',
       first_name='Your',
       last_name='Name',
       is_approved=True  # Important!
   )
   user.save()
   print(f"User created: {user.email}")
   ```

## Solution 4: Check if User Exists in Different Table

If you created the user directly in Supabase, it might be in the wrong table or format.

**Check in Supabase:**
1. Supabase Dashboard → Table Editor
2. Check `core_user` table
3. Look for your email
4. If not there, check `auth_user` table (Django default - but you're using custom User model)

**If user exists but Django can't find it:**
- The email might not match exactly (case, spaces, etc.)
- The user might be in wrong table
- The user might be missing required fields

## After Creating User

Once user is created:

1. **If `is_approved = false`:**
   - You need to approve them (see below)

2. **If `is_approved = true`:**
   - You can request OTP immediately

## Approve User

### Via Supabase:
1. Supabase Dashboard → Table Editor → `core_user`
2. Find your user
3. Edit → Set `is_approved` to `true`
4. Save

### Via Admin Panel:
1. Login to admin: `https://green-eyes-uaw4.onrender.com/admin/`
2. Users → Find your user
3. Check **"Is approved"**
4. Save

## Quick Test: Register via API

The easiest way is to register via API:

**Using PowerShell:**
```powershell
$body = @{
    email = "your-email@example.com"
    first_name = "Your"
    last_name = "Name"
    phone = "+1234567890"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://green-eyes-uaw4.onrender.com/api/auth/register/" -Method POST -ContentType "application/json" -Body $body
```

**Using curl:**
```bash
curl -X POST https://green-eyes-uaw4.onrender.com/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "first_name": "Your",
    "last_name": "Name",
    "phone": "+1234567890"
  }'
```

## Summary

**Best solution:** Register via API endpoint `/api/auth/register/`

**After registration:**
1. User will be created with `is_approved = false`
2. Approve user in Supabase or Admin panel
3. Then you can request OTP

**Alternative:** Create user via Shell or Admin panel

What email are you trying to use? I can help you register it!



