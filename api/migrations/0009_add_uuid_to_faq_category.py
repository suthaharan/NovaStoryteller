# Generated migration to add UUID field to FAQCategory model

from django.db import migrations, models
import uuid


def generate_uuids_for_faq_category(apps, schema_editor):
    """Generate UUIDs for existing FAQCategory records."""
    FAQCategory = apps.get_model('api', 'FAQCategory')
    for category in FAQCategory.objects.all():
        if not category.uuid:
            category.uuid = uuid.uuid4()
            category.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_add_uuid_to_news_category'),
    ]

    operations = [
        # Add UUID field to FAQCategory (nullable first, then populate, then make non-nullable)
        migrations.AddField(
            model_name='faqcategory',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_faq_category, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='faqcategory',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]

