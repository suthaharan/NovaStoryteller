# Generated migration to add UUID field to NewsCategory model

from django.db import migrations, models
import uuid


def generate_uuids_for_news_category(apps, schema_editor):
    """Generate UUIDs for existing NewsCategory records."""
    NewsCategory = apps.get_model('api', 'NewsCategory')
    for category in NewsCategory.objects.all():
        if not category.uuid:
            category.uuid = uuid.uuid4()
            category.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_userprofile'),
    ]

    operations = [
        # Add UUID field to NewsCategory (nullable first, then populate, then make non-nullable)
        migrations.AddField(
            model_name='newscategory',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_news_category, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='newscategory',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]

