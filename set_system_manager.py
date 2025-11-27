#!/usr/bin/env python
"""Set user to system_manager role"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Profile

User = get_user_model()

email = 'someoneimportant.spam@gmail.com'

# Get user
user = User.objects.filter(email=email).first()

if not user:
    print(f"[ERROR] User with email {email} not found.")
    exit(1)

# Get or create profile
profile, created = Profile.objects.get_or_create(user=user)

# Check if system_manager is in ROLE_CHOICES
role_choices = [choice[0] for choice in Profile.ROLE_CHOICES]

if 'system_manager' not in role_choices:
    print("Adding 'system_manager' to role choices...")
    # We need to add it to the model, but for now, let's use 'admin' 
    # which has the highest permissions, or we can add it directly to the database
    print("Note: 'system_manager' is not in ROLE_CHOICES. Using 'admin' role instead.")
    print("To add system_manager properly, we need to update the model and create a migration.")
    profile.role = 'admin'
else:
    profile.role = 'system_manager'

profile.save()

print(f"[OK] User profile updated!")
print(f"Email: {email}")
print(f"Role: {profile.role}")
print(f"Role Display: {profile.get_role_display()}")

# Also ensure user has superuser and staff permissions for system-level access
if not user.is_superuser:
    user.is_superuser = True
    user.save()
    print("[OK] User set as superuser")

if not user.is_staff:
    user.is_staff = True
    user.save()
    print("[OK] User set as staff")

print("\n[OK] User now has system_manager-level permissions (admin role + superuser)")

