#!/usr/bin/env python
"""
Quick script to check if the Django setup is correct
"""
import os
import sys

# Check if we can import Django
try:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
    import django
    django.setup()
    print("✓ Django imports successfully")
except Exception as e:
    print(f"✗ Django import failed: {e}")
    sys.exit(1)

# Check database connection
from django.db import connection
try:
    connection.ensure_connection()
    print("✓ Database connection successful")
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    print(f"  DB_NAME: {os.getenv('DB_NAME', 'NOT SET')}")
    print(f"  DB_USER: {os.getenv('DB_USER', 'NOT SET')}")
    print(f"  DB_HOST: {os.getenv('DB_HOST', 'NOT SET')}")
    print(f"  DB_PORT: {os.getenv('DB_PORT', 'NOT SET')}")

# Check URLs
from django.urls import get_resolver
try:
    resolver = get_resolver()
    print("✓ URL configuration loaded")
    print(f"  Available URL patterns: {len(list(resolver.url_patterns))}")
except Exception as e:
    print(f"✗ URL configuration error: {e}")

print("\nSetup check complete!")









