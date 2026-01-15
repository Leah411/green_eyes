#!/usr/bin/env python
"""
Delete user dovish770@gmail.com from database
Usage: python delete_dovish.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from core.models import User

def main():
    email = "dovish770@gmail.com"
    
    print(f"\n{'='*60}")
    print(f"Deleting user: {email}")
    print(f"{'='*60}\n")
    
    try:
        user = User.objects.get(email=email)
        username = user.username
        user_email = user.email
        
        print(f"Found user: {username} ({user_email})")
        print(f"Full Name: {user.get_full_name() or 'N/A'}")
        print(f"Date Joined: {user.date_joined}")
        print("\nDeleting user and all related data...")
        
        # Delete user (cascades will handle related data)
        user.delete()
        
        print(f"\n{'='*60}")
        print(f"✓ SUCCESS: User '{username}' ({user_email}) has been deleted!")
        print(f"The user can now register again with the email: {user_email}")
        print(f"{'='*60}\n")
        
    except User.DoesNotExist:
        print(f"[ERROR] User with email '{email}' NOT FOUND in the database.")
        print("The user may have already been deleted.\n")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to delete user: {e}\n")
        sys.exit(1)

if __name__ == '__main__':
    main()

