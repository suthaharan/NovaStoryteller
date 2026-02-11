# Storage Structure

## Story Assets Storage

All story assets (images and audio) are now stored under a unified structure grouped by story ID:

```
media/
  └── YYYY/
      └── MM/
          └── <story-id>/
              ├── image_<timestamp>.jpg
              └── audio_<timestamp>.mp3
```

### Example

For a story created in February 2026 with ID `a9de91fb-b05c-455b-8b9e-a059e53c9637`:

```
media/
  └── 2026/
      └── 02/
          └── a9de91fb-b05c-455b-8b9e-a059e53c9637/
              ├── image_20260209_022613.jpg
              └── audio_20260209_022621.mp3
```

## Benefits

1. **Organized by Story**: All assets for a story are in one directory
2. **Easy Access**: Find all files for a story by its ID
3. **Clean Structure**: Year/month organization for easy archival
4. **No Duplication**: Single location for all story-related files

## Database Storage

The database stores the relative path from `MEDIA_ROOT`:

- Image: `2026/02/<story-id>/image_<timestamp>.jpg`
- Audio: `2026/02/<story-id>/audio_<timestamp>.mp3`

## URL Access

Files are accessible via:

- Image: `http://localhost:8000/media/2026/02/<story-id>/image_<timestamp>.jpg`
- Audio: `http://localhost:8000/media/2026/02/<story-id>/audio_<timestamp>.mp3`

## Migration Notes

If you have existing stories with old paths:
- Old images: `stories/2026/02/stories_<id>_<timestamp>.jpg`
- Old audio: `stories/audio/2026/02/audio_<id>_<timestamp>.mp3`

New stories will use the new structure. Old files will continue to work but new uploads will use the new path.

