"""
Script to create user groups for the application.
Run this after database is configured and migrations are applied:
    python manage.py shell < create_groups.py
Or run directly:
    python manage.py shell
Then paste the code below.
"""

from django.contrib.auth.models import Group

roles = ["SuperAdmin", "UnitManager", "BranchManager", "SectionManager", "TeamManager", "RegularUser"]

for role in roles:
    group, created = Group.objects.get_or_create(name=role)
    if created:
        print(f"Created group: {role}")
    else:
        print(f"Group already exists: {role}")

print("\nAll groups created successfully!")

