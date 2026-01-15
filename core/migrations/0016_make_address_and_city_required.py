# Generated manually on 2026-01-14
from django.db import migrations, models
import django.db.models.deletion


def fill_missing_address_and_city(apps, schema_editor):
    """Fill missing address and city for existing profiles"""
    Profile = apps.get_model('core', 'Profile')
    Location = apps.get_model('core', 'Location')
    
    # Get default location (Tel Aviv) or create one if doesn't exist
    default_city = Location.objects.filter(name_he__icontains='תל אביב').first()
    if not default_city:
        default_city = Location.objects.first()
    
    # Update profiles with missing address or city
    from django.db.models import Q
    profiles_to_update = Profile.objects.filter(
        Q(address__isnull=True) | Q(address='') | Q(city__isnull=True)
    )
    
    for profile in profiles_to_update:
        if not profile.address or profile.address == '':
            profile.address = 'לא צוין'
        if not profile.city and default_city:
            profile.city = default_city
        profile.save()


def reverse_fill_missing_address_and_city(apps, schema_editor):
    """Reverse migration - no need to do anything"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0015_add_service_type_to_profile'),
    ]

    operations = [
        # First, fill missing data
        migrations.RunPython(fill_missing_address_and_city, reverse_fill_missing_address_and_city),
        # Then, make fields required
        migrations.AlterField(
            model_name='profile',
            name='address',
            field=models.CharField(help_text='כתובת מגורים', max_length=200),
        ),
        migrations.AlterField(
            model_name='profile',
            name='city',
            field=models.ForeignKey(help_text='עיר מגורים', on_delete=django.db.models.deletion.PROTECT, related_name='residents', to='core.location'),
        ),
    ]

