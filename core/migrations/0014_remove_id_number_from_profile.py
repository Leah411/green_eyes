# Generated manually on 2026-01-14
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_add_order_number_to_unit'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profile',
            name='id_number',
        ),
    ]

