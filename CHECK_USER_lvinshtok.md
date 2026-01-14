# Check User: lvinshtok@gmail.com

## Quick Check in Render Shell

Run this in Render Shell:

```python
from core.models import User

# Check if user exists
email = "lvinshtok@gmail.com"
try:
    user = User.objects.get(email=email)
    print(f"✅ User found!")
    print(f"   Email: {user.email}")
    print(f"   Username: {user.username}")
    print(f"   Approved: {user.is_approved}")
    print(f"   Active: {user.is_active}")
except User.DoesNotExist:
    print(f"❌ User with email {email} NOT FOUND")
    
    # Show all users
    all_users = User.objects.all()
    print(f"\nAll users in database ({all_users.count()}):")
    for u in all_users:
        print(f"  - {u.email} (approved: {u.is_approved})")
```

## If User Doesn't Exist - Create It

If the user is not found, create it:

```python
from core.models import User

user = User.objects.create_user(
    username='lvinshtok',
    email='lvinshtok@gmail.com',
    password='temp-password-123',  # Will use OTP for login anyway
    first_name='Leah',
    last_name='Vinshtok',
    is_approved=True  # Important - approve immediately
)
user.save()
print(f"✅ User created: {user.email}, Approved: {user.is_approved}")
```

## If User Exists But Not Approved

If user exists but `is_approved = False`:

```python
from core.models import User

user = User.objects.get(email='lvinshtok@gmail.com')
user.is_approved = True
user.save()
print(f"✅ User approved: {user.email}")
```

## Complete Check and Fix Script

Run this complete script:

```python
from core.models import User

email = "lvinshtok@gmail.com"

# Check if exists
try:
    user = User.objects.get(email=email)
    print(f"✅ User found: {user.email}")
    print(f"   Username: {user.username}")
    print(f"   Approved: {user.is_approved}")
    print(f"   Active: {user.is_active}")
    
    # If not approved, approve it
    if not user.is_approved:
        user.is_approved = True
        user.save()
        print(f"✅ User approved!")
    else:
        print(f"✅ User already approved")
        
except User.DoesNotExist:
    print(f"❌ User not found - creating...")
    
    # Create user
    user = User.objects.create_user(
        username='lvinshtok',
        email='lvinshtok@gmail.com',
        password='temp-password-123',
        first_name='Leah',
        last_name='Vinshtok',
        is_approved=True
    )
    user.save()
    print(f"✅ User created and approved: {user.email}")
```

## After Running Script

Once user exists and is approved:

1. ✅ Try requesting OTP again
2. ✅ Should work now!

## Check in Supabase

Also check directly in Supabase:

1. Supabase Dashboard → Table Editor
2. Open `core_user` table
3. Search for `lvinshtok@gmail.com`
4. Check:
   - Does it exist?
   - Is `is_approved` = `true`?

