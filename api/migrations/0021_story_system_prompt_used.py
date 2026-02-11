# Generated manually
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0020_storyscene'),
    ]

    operations = [
        migrations.AddField(
            model_name='story',
            name='system_prompt_used',
            field=models.TextField(blank=True, help_text='Full system prompt used for story generation (includes template and user settings)'),
        ),
    ]

