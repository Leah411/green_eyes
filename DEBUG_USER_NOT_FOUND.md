# Debug: User Exists in DB But Not Found

## The Problem

You're getting: `"User with this email does not exist."`

But you say the user exists in the database.

## Possible Causes

### Cause 1: User in Wrong Table

Django uses custom User model (`core.User`), so users should be in `core_user` table, NOT `auth_user`.

**Check:**
1. Supabase Dashboard → Table Editor
2. Check `core_user` table (not `auth_user`)
3. Is your user there?

### Cause 2: Email Doesn't Match Exactly

The email might not match exactly:
- Case sensitivity (usually not, but check)
- Extra spaces
- Different email format

**Check:**
1. What email are you sending in the request?
2. What email is in the database?
3. Do they match exactly?

### Cause 3: User in Different Database

If you have multiple databases or the user was created in a different environment.

**Check:**
1. Is the user in the same Supabase project?
2. Are you connecting to the right database?

## How to Debug

### Step 1: Check Which Table Has the User

In Render Shell:
```python
from django.db import connection

# Check core_user table
with connection.cursor() as cursor:
    cursor.execute("SELECT email, username, is_approved FROM core_user")
    users = cursor.fetchall()
    print("Users in core_user table:")
    for user in users:
        print(f"  Email: {user[0]}, Username: {user[1]}, Approved: {user[2]}")

# Check auth_user table (if exists)
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT email, username FROM auth_user")
        users = cursor.fetchall()
        print("\nUsers in auth_user table:")
        for user in users:
            print(f"  Email: {user[0]}, Username: {user[1]}")
except Exception as e:
    print(f"\nNo auth_user table (expected): {e}")
```

### Step 2: Try to Find User via Django

In Render Shell:
```python
from core.models import User

# Try to find by email
email = "your-email@example.com"  # Replace with actual email
try:
    user = User.objects.get(email=email)
    print(f"✅ Found user: {user.email}, Username: {user.username}, Approved: {user.is_approved}")
except User.DoesNotExist:
    print(f"❌ User with email {email} not found")
    
    # List all users
    all_users = User.objects.all()
    print(f"\nAll users in database ({all_users.count()} total):")
    for u in all_users:
        print(f"  - Email: {u.email}, Username: {u.username}, Approved: {u.is_approved}")
```

### Step 3: Check Email Format

In Render Shell:
```python
from core.models import User

# What email are you searching for?
search_email = "your-email@example.com"  # Replace with actual

# Try exact match
try:
    user = User.objects.get(email=search_email)
    print(f"✅ Found with exact match: {user.email}")
except User.DoesNotExist:
    print(f"❌ Not found with exact match")
    
    # Try case-insensitive
    try:
        user = User.objects.get(email__iexact=search_email)
        print(f"✅ Found with case-insensitive: {user.email}")
    except User.DoesNotExist:
        print(f"❌ Not found even with case-insensitive")
        
        # Show all emails for comparison
        all_emails = User.objects.values_list('email', flat=True)
        print(f"\nAll emails in database:")
        for e in all_emails:
            print(f"  - '{e}'")
            print(f"    Matches? {e.lower() == search_email.lower()}")
```

### Step 4: Check if User Model is Correct

In Render Shell:
```python
from django.contrib.auth import get_user_model
from core.models import User

# Check which User model is being used
UserModel = get_user_model()
print(f"User model: {UserModel}")
print(f"User model location: {UserModel.__module__}.{UserModel.__name__}")

# Check table name
print(f"User table name: {UserModel._meta.db_table}")

# Count users
count = UserModel.objects.count()
print(f"Total users: {count}")
```

## Common Solutions

### Solution 1: User in auth_user Instead of core_user

If user is in `auth_user` table (Django default) instead of `core_user`:

**This shouldn't happen** because you're using custom User model (`AUTH_USER_MODEL = 'core.User'`).

But if it does:
1. Migrate the user from `auth_user` to `core_user`
2. Or create user properly through Django

### Solution 2: Email Case/Format Mismatch

If emails don't match exactly:

1. **Check the exact email in database:**
   ```python
   from core.models import User
   user = User.objects.first()
   print(f"Email in DB: '{user.email}'")
   print(f"Email repr: {repr(user.email)}")
   ```

2. **Check what email you're sending:**
   - Look at the request body in Network tab
   - Make sure it matches exactly

### Solution 3: User Created Directly in Supabase

If user was created directly in Supabase (not through Django):

**Problem:** Django might not recognize it properly.

**Solution:** Create user through Django instead:
```python
from core.models import User

user = User.objects.create_user(
    username='existing-username',
    email='existing-email@example.com',
    password='temp-password',
    is_approved=True
)
```

## Quick Test

Run this in Render Shell to see what's happening:

```python
from core.models import User
from django.db import connection

# Method 1: Django ORM
print("=== Django ORM ===")
all_users = User.objects.all()
print(f"Total users (Django): {all_users.count()}")
for u in all_users:
    print(f"  - {u.email} (approved: {u.is_approved})")

# Method 2: Raw SQL
print("\n=== Raw SQL ===")
with connection.cursor() as cursor:
    cursor.execute("SELECT email, is_approved FROM core_user")
    users = cursor.fetchall()
    print(f"Total users (SQL): {len(users)}")
    for email, approved in users:
        print(f"  - {email} (approved: {approved})")

# Method 3: Try to find specific email
test_email = "your-email@example.com"  # Replace with actual
print(f"\n=== Searching for: {test_email} ===")
try:
    user = User.objects.get(email=test_email)
    print(f"✅ Found: {user.email}, Approved: {user.is_approved}")
except User.DoesNotExist:
    print(f"❌ Not found")
    print("Available emails:")
    for u in User.objects.all():
        print(f"  - '{u.email}'")
```

## What to Do Now

1. **Run the debug script above** in Render Shell
2. **Check which table has the user** (`core_user` vs `auth_user`)
3. **Verify email matches exactly**
4. **Check if user was created through Django or directly in Supabase**

## Summary

**If user exists in DB but Django can't find it:**
- User might be in wrong table (`auth_user` instead of `core_user`)
- Email doesn't match exactly
- User was created directly in Supabase (not through Django)

**Run the debug script** to see what's actually in the database!

What do you see when you run the debug script?

