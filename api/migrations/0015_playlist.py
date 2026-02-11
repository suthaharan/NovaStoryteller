# Generated manually

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_storysession_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Playlist',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Playlist name', max_length=200)),
                ('description', models.TextField(blank=True, help_text='Optional playlist description')),
                ('is_public', models.BooleanField(default=False, help_text='Whether the playlist is public (visible to all users)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(help_text='User who created this playlist', on_delete=django.db.models.deletion.CASCADE, related_name='playlists', to='auth.user')),
            ],
            options={
                'verbose_name': 'Playlist',
                'verbose_name_plural': 'Playlists',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='playlist',
            index=models.Index(fields=['user', '-created_at'], name='api_playli_user_id_created_idx'),
        ),
        migrations.AddIndex(
            model_name='playlist',
            index=models.Index(fields=['is_public', '-created_at'], name='api_playli_is_publ_created_idx'),
        ),
        migrations.AddField(
            model_name='playlist',
            name='stories',
            field=models.ManyToManyField(blank=True, help_text='Stories in this playlist', related_name='playlists', to='api.story'),
        ),
    ]

