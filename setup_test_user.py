#!/usr/bin/env python
"""Setup test user with specific email and password"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Profile, AccessRequest

User = get_user_model()

email = 'someoneimportant.spam@gmail.com'
password = '123456'

# Check if user exists
user = User.objects.filter(email=email).first()

if user:
    print(f"User found: {user.username}")
    print(f"Email: {user.email}")
    print(f"Is Approved: {user.is_approved}")
    print(f"Is Active: {user.is_active}")
    print(f"Is Superuser: {user.is_superuser}")
    
    # Set password
    user.set_password(password)
    user.save()
    print(f"\n[OK] Password set to: {password}")
    
    # Make sure user is approved and active
    if not user.is_approved:
        user.is_approved = True
        user.save()
        print("[OK] User approved")
    
    if not user.is_active:
        user.is_active = True
        user.save()
        print("[OK] User activated")
    
    # Create access request if it doesn't exist
    access_request, created = AccessRequest.objects.get_or_create(
        user=user,
        defaults={'status': 'approved'}
    )
    if access_request.status != 'approved':
        access_request.status = 'approved'
        access_request.save()
        print("[OK] Access request approved")
    
    print(f"\n[OK] User is ready to login!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    
else:
    print(f"[ERROR] User with email {email} not found.")
    print("Creating new user...")
    
    # Create new user
    username = email.split('@')[0]
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_approved=True,
        is_active=True,
        is_superuser=True,
        is_staff=True
    )
    
    # Create profile
    Profile.objects.create(
        user=user,
        role='admin'
    )
    
    # Create approved access request
    AccessRequest.objects.create(
        user=user,
        status='approved'
    )
    
    print(f"[OK] User created and ready!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Username: {username}")

