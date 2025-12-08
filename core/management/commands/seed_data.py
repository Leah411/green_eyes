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
        """Create organizational structure: פריזמה → נחשול/תמ"צ → מדורים → צוותים"""
        self.stdout.write('Creating organizational units...')
        
        # Unit: פריזמה
        prisma, created = Unit.objects.get_or_create(
            code='PRISMA-001',
            defaults={
                'name': 'Prisma',
                'name_he': 'פריזמה',
                'unit_type': 'unit',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created unit: {prisma.name_he}'))
        
        # Branch: נחשול
        nahshol, created = Unit.objects.get_or_create(
            code='NAHSHOL-001',
            defaults={
                'name': 'Nahshol',
                'name_he': 'נחשול',
                'unit_type': 'branch',
                'parent': prisma,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created branch: {nahshol.name_he}'))
        
        # Branch: תמ"צ
        tamz, created = Unit.objects.get_or_create(
            code='TAMZ-001',
            defaults={
                'name': 'Tamz',
                'name_he': 'תמ"צ',
                'unit_type': 'branch',
                'parent': prisma,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'  ✓ Created branch: {tamz.name_he}'))
        
        # Sections under תמ"צ
        sections_data = [
            ('GAUSS-001', 'Gauss', 'גאוס', [
                ('TEAM-GAUSS-001', 'Development', 'פיתוח'),
                ('TEAM-GAUSS-002', 'Research', 'מחקר'),
                ('TEAM-GAUSS-003', 'Olympus', 'אולימפוס'),
            ]),
            ('MAXWELL-001', 'Maxwell', 'מקסוול', [
                ('TEAM-MAXWELL-001', 'NOCOUT', 'NOCOUT'),
                ('TEAM-MAXWELL-002', 'PM', 'PM'),
                ('TEAM-MAXWELL-003', 'PD', 'PD'),
                ('TEAM-MAXWELL-004', 'DA', 'DA'),
                ('TEAM-MAXWELL-005', 'Architect', 'ארכיטקט'),
            ]),
            ('PLANNING-001', 'Planning', 'תכנון', [
                ('TEAM-PLANNING-001', 'Harmony', 'הרמוניה'),
                ('TEAM-PLANNING-002', 'Guaat', 'גואט'),
            ]),
            ('INVESTIGATION-001', 'Investigation', 'תחקור', [
                ('TEAM-INVESTIGATION-001', 'Artemis', 'ארתמיס'),
                ('TEAM-INVESTIGATION-002', 'Butterfly Effect', 'אפקט הפרפר'),
            ]),
            ('REALTIME-001', 'Real Time', 'זמן אמת', [
                ('TEAM-REALTIME-001', 'Upper Shield', 'מגן עליון'),
                ('TEAM-REALTIME-002', 'Black Shield', 'מגן שחור'),
                ('TEAM-REALTIME-003', 'Regulav', 'רגולאב'),
                ('TEAM-REALTIME-004', 'Pantheon', 'פנתאון'),
            ]),
        ]
        
        created_sections = {}
        created_teams = {}
        
        for section_code, section_name, section_name_he, teams_list in sections_data:
            section, created = Unit.objects.get_or_create(
                code=section_code,
                defaults={
                    'name': section_name,
                    'name_he': section_name_he,
                    'unit_type': 'section',
                    'parent': tamz,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Created section: {section.name_he}'))
            created_sections[section_code] = section
            
            # Create teams for this section
            for team_code, team_name, team_name_he in teams_list:
                team, created = Unit.objects.get_or_create(
                    code=team_code,
                    defaults={
                        'name': team_name,
                        'name_he': team_name_he,
                        'unit_type': 'team',
                        'parent': section,
                    }
                )
                if created:
                    self.stdout.write(self.style.SUCCESS(f'    ✓ Created team: {team.name_he}'))
                created_teams[team_code] = team
        
        self.stdout.write('')
        return {
            'prisma': prisma,
            'nahshol': nahshol,
            'tamz': tamz,
            'sections': created_sections,
            'teams': created_teams,
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
                unit=units['prisma'],
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
                unit=units['prisma'],
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
                unit=units['tamz'],
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
            # Use first section from tamz
            first_section = list(units['sections'].values())[0] if units['sections'] else None
            Profile.objects.create(
                user=section_manager,
                unit=first_section,
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
            # Use first team from first section
            first_team = list(units['teams'].values())[0] if units['teams'] else None
            Profile.objects.create(
                user=team_manager,
                unit=first_team,
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
                # Use first team from first section
                first_team = list(units['teams'].values())[0] if units['teams'] else None
                Profile.objects.create(
                    user=user,
                    unit=first_team,
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
            # Use second team if available
            teams_list = list(units['teams'].values())
            second_team = teams_list[1] if len(teams_list) > 1 else teams_list[0] if teams_list else None
            Profile.objects.create(
                user=pending_user,
                unit=second_team,
                role='user',
                id_number='666666666'
            )
            AccessRequest.objects.create(
                user=pending_user,
                status='pending'
            )
            self.stdout.write(self.style.WARNING(f'  → Created pending user: {pending_user.username} (password: user123) - requires approval'))
        
        self.stdout.write('')

