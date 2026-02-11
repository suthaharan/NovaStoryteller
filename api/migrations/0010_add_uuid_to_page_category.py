# Generated migration to add UUID field to PageCategory model

from django.db import migrations, models
import uuid


def generate_uuids_for_page_category(apps, schema_editor):
    """Generate UUIDs for existing PageCategory records."""
    PageCategory = apps.get_model('api', 'PageCategory')
    for category in PageCategory.objects.all():
        if not category.uuid:
            category.uuid = uuid.uuid4()
            category.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_add_uuid_to_faq_category'),
    ]

    operations = [
        # Add UUID field to PageCategory (nullable first, then populate, then make non-nullable)
        migrations.AddField(
            model_name='pagecategory',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_page_category, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='pagecategory',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]

