import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yirok_project.settings')
django.setup()

from core.models import Unit

# Check if תמ"צ exists
tamz = Unit.objects.filter(code='TAMZ-001').first()
if not tamz:
    print('ERROR: תמ"צ does not exist!')
    # Create it
    prisma = Unit.objects.get(code='PRISMA-001')
    tamz = Unit.objects.create(
        code='TAMZ-001',
        name='Tamz',
        name_he='תמ"צ',
        unit_type='branch',
        parent=prisma
    )
    print('✓ Created תמ"צ')
else:
    print(f'✓ תמ"צ exists: id={tamz.id}, parent_id={tamz.parent_id}')
    # Make sure parent is פריזמה
    prisma = Unit.objects.get(code='PRISMA-001')
    if tamz.parent_id != prisma.id:
        tamz.parent = prisma
        tamz.save()
        print(f'✓ Updated תמ"צ parent to פריזמה (id: {prisma.id})')

# List all branches
branches = Unit.objects.filter(unit_type='branch')
print(f'\nAll branches ({branches.count()}):')
for b in branches:
    parent_name = b.parent.name_he if b.parent else None
    print(f'  - {b.name_he} (id: {b.id}, parent: {parent_name}, parent_id: {b.parent_id})')

