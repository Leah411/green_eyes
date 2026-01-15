# Generated manually on 2026-01-14
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0014_remove_id_number_from_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='service_type',
            field=models.CharField(blank=True, choices=[('חובה', 'חובה'), ('קבע', 'קבע'), ('יועץ', 'יועץ'), ('אעצ', 'אעצ'), ('מילואים', 'מילואים')], help_text='סוג שירות', max_length=20),
        ),
    ]

