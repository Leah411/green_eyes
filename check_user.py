#!/usr/bin/env python
"""
Script to check if a user exists in the system
Usage: python check_user.py <email>
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Profile, AccessRequest

User = get_user_model()

def check_user(email):
    """Check if user exists and display their information"""
    print(f"\n{'='*60}")
    print(f"Checking user: {email}")
    print(f"{'='*60}\n")
    
    # Check by email
    user = User.objects.filter(email=email).first()
    
    if not user:
        print(f"[X] User with email '{email}' NOT FOUND in the system")
        print("\nOptions:")
        print("   1. User needs to register first")
        print("   2. Check if email is correct")
        print("   3. Check if user exists with different email")
        return False
    
    # User found - display information
    print(f"[OK] User FOUND!")
    print(f"\nUser Information:")
    print(f"   Username: {user.username}")
    print(f"   Email: {user.email}")
    print(f"   Full Name: {user.get_full_name() or 'N/A'}")
    print(f"   Phone: {user.phone or 'N/A'}")
    print(f"\nStatus:")
    print(f"   Is Active: {'Yes' if user.is_active else 'No'}")
    print(f"   Is Approved: {'Yes' if user.is_approved else 'No (needs admin approval)'}")
    print(f"   Is Staff: {'Yes' if user.is_staff else 'No'}")
    print(f"   Is Superuser: {'Yes' if user.is_superuser else 'No'}")
    print(f"   Date Joined: {user.date_joined}")
    
    # Check profile
    try:
        profile = user.profile
        print(f"\nProfile Information:")
        print(f"   Role: {profile.get_role_display()} ({profile.role})")
        print(f"   Unit: {profile.unit.name if profile.unit else 'N/A'}")
        print(f"   ID Number: {profile.id_number or 'N/A'}")
    except Profile.DoesNotExist:
        print(f"\n[WARNING] No profile found for this user")
    
    # Check access request
    access_request = AccessRequest.objects.filter(user=user).first()
    if access_request:
        print(f"\nAccess Request:")
        print(f"   Status: {access_request.get_status_display()} ({access_request.status})")
        print(f"   Submitted: {access_request.submitted_at}")
        if access_request.approved_by:
            print(f"   Approved By: {access_request.approved_by.username}")
    
    # Check if user can request OTP
    print(f"\nOTP Status:")
    if not user.is_approved:
        print(f"   [X] Cannot request OTP - User is not approved")
        print(f"   [TIP] User needs to be approved by admin first")
    elif not user.is_active:
        print(f"   [X] Cannot request OTP - User is not active")
    else:
        print(f"   [OK] User can request OTP")
    
    return True

def list_all_users():
    """List all users in the system"""
    print(f"\n{'='*60}")
    print(f"All Users in System")
    print(f"{'='*60}\n")
    
    users = User.objects.all().order_by('date_joined')
    
    if not users.exists():
        print("No users found in the system")
        return
    
    print(f"Total users: {users.count()}\n")
    print(f"{'Username':<20} {'Email':<30} {'Approved':<10} {'Active':<10}")
    print("-" * 70)
    
    for user in users:
        approved = "Yes" if user.is_approved else "No"
        active = "Yes" if user.is_active else "No"
        print(f"{user.username:<20} {user.email:<30} {approved:<10} {active:<10}")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Check specific user
        email = sys.argv[1]
        check_user(email)
    else:
        # List all users
        print("No email provided. Listing all users...\n")
        list_all_users()
        print("\n\nTo check a specific user, run:")
        print("   python check_user.py <email>")

