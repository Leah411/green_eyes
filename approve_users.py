#!/usr/bin/env python
"""Quick script to approve pending access requests"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from core.models import AccessRequest
from django.contrib.auth import get_user_model

User = get_user_model()

# Get an admin user
admin = User.objects.filter(is_superuser=True).first()
if not admin:
    print("[ERROR] No superuser found. Create one with: python manage.py createsuperuser")
    exit(1)

# Get pending requests
pending_requests = AccessRequest.objects.filter(status='pending')

if not pending_requests.exists():
    print("[OK] No pending access requests found.")
    exit(0)

print(f"Found {pending_requests.count()} pending request(s):\n")

# Approve each request
for request in pending_requests:
    print(f"Approving: {request.user.username} ({request.user.email})...")
    request.approve(admin)
    print(f"  [OK] Approved! User can now request OTP and login.\n")

print(f"[OK] Successfully approved {pending_requests.count()} user(s)!")
