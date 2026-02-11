# Generated migration to add UUID fields to News, FAQ, and Page models

from django.db import migrations, models
import uuid


def generate_uuids_for_news(apps, schema_editor):
    """Generate UUIDs for existing News records."""
    News = apps.get_model('api', 'News')
    for news in News.objects.all():
        if not news.uuid:
            news.uuid = uuid.uuid4()
            news.save(update_fields=['uuid'])


def generate_uuids_for_faq(apps, schema_editor):
    """Generate UUIDs for existing FAQ records."""
    FAQ = apps.get_model('api', 'FAQ')
    for faq in FAQ.objects.all():
        if not faq.uuid:
            faq.uuid = uuid.uuid4()
            faq.save(update_fields=['uuid'])


def generate_uuids_for_page(apps, schema_editor):
    """Generate UUIDs for existing Page records."""
    Page = apps.get_model('api', 'Page')
    for page in Page.objects.all():
        if not page.uuid:
            page.uuid = uuid.uuid4()
            page.save(update_fields=['uuid'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_pagecategory_faq_slug_alter_news_featured_image_page'),
    ]

    operations = [
        # Add UUID field to News (nullable first, then populate, then make non-nullable)
        migrations.AddField(
            model_name='news',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_news, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='news',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
        
        # Add UUID field to FAQ
        migrations.AddField(
            model_name='faq',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_faq, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='faq',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
        
        # Add UUID field to Page
        migrations.AddField(
            model_name='page',
            name='uuid',
            field=models.UUIDField(null=True, blank=True, db_index=True),
        ),
        migrations.RunPython(generate_uuids_for_page, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='page',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, unique=True, editable=False, db_index=True),
        ),
    ]


