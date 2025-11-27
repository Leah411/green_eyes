"""
Django management command to seed initial data.
Run: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from django.contrib.auth import get_user_model
from core.models import Unit, Profile, AccessRequest
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds initial data: groups, sample units, and sample users'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting data seeding...\n'))
        
        # Create groups
        self.create_groups()
        
        # Create organizational structure
        units = self.create_units()
        
        # Create sample users
        self.create_sample_users(units)
        
        self.stdout.write(self.style.SUCCESS('\n✓ Data seeding completed successfully!'))

    def create_groups(self):
        """Create user groups"""
        self.stdout.write('Creating user groups...')
        roles = [
            "SuperAdmin",
            "UnitManager", 
            "BranchManager", 
            "SectionManager", 
            "TeamManager", 
            "RegularUser"
        ]
        
        for role in roles:
            group, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created group: {role}'))
            else:
                self.stdout.write(self.style.WARNING(f'  → Group already exists: {role}'))
        self.stdout.write('')

    def create_units(self):
        """Create organizational structure"""
        self.stdout.write('Creating organizational units...')
        
        # Main Unit
        main_unit, created = Unit.objects.get_or_create(
            code='UNIT-001',
            defaults={
                'name': 'Main Unit',
                'name_he': 'יחידה ראשית',
                'unit_type': 'unit',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created unit: {main_unit.name}'))
        
        # Branch 1
        branch1, created = Unit.objects.get_or_create(
            code='BRANCH-001',
            defaults={
                'name': 'Branch 1',
                'name_he': 'סניף 1',
                'unit_type': 'branch',
                'parent': main_unit,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created branch: {branch1.name}'))
        
        # Branch 2
        branch2, created = Unit.objects.get_or_create(
            code='BRANCH-002',
            defaults={
                'name': 'Branch 2',
                'name_he': 'סניף 2',
                'unit_type': 'branch',
                'parent': main_unit,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created branch: {branch2.name}'))
        
        # Section 1 (under Branch 1)
        section1, created = Unit.objects.get_or_create(
            code='SECTION-001',
            defaults={
                'name': 'Section 1',
                'name_he': 'מחלקה 1',
                'unit_type': 'section',
                'parent': branch1,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created section: {section1.name}'))
        
        # Section 2 (under Branch 1)
        section2, created = Unit.objects.get_or_create(
            code='SECTION-002',
            defaults={
                'name': 'Section 2',
                'name_he': 'מחלקה 2',
                'unit_type': 'section',
                'parent': branch1,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created section: {section2.name}'))
        
        # Team 1 (under Section 1)
        team1, created = Unit.objects.get_or_create(
            code='TEAM-001',
            defaults={
                'name': 'Team 1',
                'name_he': 'צוות 1',
                'unit_type': 'team',
                'parent': section1,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created team: {team1.name}'))
        
        # Team 2 (under Section 1)
        team2, created = Unit.objects.get_or_create(
            code='TEAM-002',
            defaults={
                'name': 'Team 2',
                'name_he': 'צוות 2',
                'unit_type': 'team',
                'parent': section1,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created team: {team2.name}'))
        
        self.stdout.write('')
        return {
            'main_unit': main_unit,
            'branch1': branch1,
            'branch2': branch2,
            'section1': section1,
            'section2': section2,
            'team1': team1,
            'team2': team2,
        }

    def create_sample_users(self, units):
        """Create sample users with different roles"""
        self.stdout.write('Creating sample users...')
        
        # Admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@yirok.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'is_approved': True,
                'is_active': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            Profile.objects.create(
                user=admin_user,
                unit=units['main_unit'],
                role='admin',
                id_number='000000000'
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created admin user: {admin_user.username} (password: admin123)'))
        
        # Unit Manager
        unit_manager, created = User.objects.get_or_create(
            username='unit_manager',
            defaults={
                'email': 'unit.manager@yirok.com',
                'first_name': 'Unit',
                'last_name': 'Manager',
                'is_approved': True,
                'is_active': True,
            }
        )
        if created:
            unit_manager.set_password('manager123')
            unit_manager.save()
            Profile.objects.create(
                user=unit_manager,
                unit=units['main_unit'],
                role='unit_manager',
                id_number='111111111'
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created unit manager: {unit_manager.username} (password: manager123)'))
        
        # Branch Manager
        branch_manager, created = User.objects.get_or_create(
            username='branch_manager',
            defaults={
                'email': 'branch.manager@yirok.com',
                'first_name': 'Branch',
                'last_name': 'Manager',
                'is_approved': True,
                'is_active': True,
            }
        )
        if created:
            branch_manager.set_password('manager123')
            branch_manager.save()
            Profile.objects.create(
                user=branch_manager,
                unit=units['branch1'],
                role='branch_manager',
                id_number='222222222'
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created branch manager: {branch_manager.username} (password: manager123)'))
        
        # Section Manager
        section_manager, created = User.objects.get_or_create(
            username='section_manager',
            defaults={
                'email': 'section.manager@yirok.com',
                'first_name': 'Section',
                'last_name': 'Manager',
                'is_approved': True,
                'is_active': True,
            }
        )
        if created:
            section_manager.set_password('manager123')
            section_manager.save()
            Profile.objects.create(
                user=section_manager,
                unit=units['section1'],
                role='section_manager',
                id_number='333333333'
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created section manager: {section_manager.username} (password: manager123)'))
        
        # Team Manager
        team_manager, created = User.objects.get_or_create(
            username='team_manager',
            defaults={
                'email': 'team.manager@yirok.com',
                'first_name': 'Team',
                'last_name': 'Manager',
                'is_approved': True,
                'is_active': True,
            }
        )
        if created:
            team_manager.set_password('manager123')
            team_manager.save()
            Profile.objects.create(
                user=team_manager,
                unit=units['team1'],
                role='team_manager',
                id_number='444444444'
            )
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created team manager: {team_manager.username} (password: manager123)'))
        
        # Regular Users
        for i in range(1, 4):
            user, created = User.objects.get_or_create(
                username=f'user{i}',
                defaults={
                    'email': f'user{i}@yirok.com',
                    'first_name': f'User',
                    'last_name': f'{i}',
                    'is_approved': True,
                    'is_active': True,
                }
            )
            if created:
                user.set_password('user123')
                user.save()
                Profile.objects.create(
                    user=user,
                    unit=units['team1'],
                    role='user',
                    id_number=f'55555555{i}'
                )
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created user: {user.username} (password: user123)'))
        
        # Pending user (not approved)
        pending_user, created = User.objects.get_or_create(
            username='pending_user',
            defaults={
                'email': 'pending@yirok.com',
                'first_name': 'Pending',
                'last_name': 'User',
                'is_approved': False,
                'is_active': True,
            }
        )
        if created:
            pending_user.set_password('user123')
            pending_user.save()
            Profile.objects.create(
                user=pending_user,
                unit=units['team2'],
                role='user',
                id_number='666666666'
            )
            AccessRequest.objects.create(
                user=pending_user,
                status='pending'
            )
            self.stdout.write(self.style.WARNING(f'  → Created pending user: {pending_user.username} (password: user123) - requires approval'))
        
        self.stdout.write('')

