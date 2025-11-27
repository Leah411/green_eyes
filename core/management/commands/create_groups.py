"""
Django management command to create user groups.
Run: python manage.py create_groups
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group


class Command(BaseCommand):
    help = 'Creates user groups for the application'

    def handle(self, *args, **options):
        roles = ["SuperAdmin", "UnitManager", "BranchManager", "SectionManager", "TeamManager", "RegularUser"]
        
        for role in roles:
            group, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created group: {role}'))
            else:
                self.stdout.write(self.style.WARNING(f'→ Group already exists: {role}'))
        
        self.stdout.write(self.style.SUCCESS('\nAll groups created successfully!'))

