# Audio Generation Fix and Playlist Feature

## Audio Generation Fix

### Issue
Audio narration was not being generated because Nova 2 Sonic bidirectional streaming is complex and requires WebSocket implementation, which was not fully implemented.

### Solution
- **Simplified to use Amazon Polly directly** for reliable text-to-speech
- Added audio upsampling utility (16kHz → 24kHz) for consistency
- Improved error logging to help diagnose issues
- Audio generation should now work reliably

### AWS Permissions Required

Your AWS credentials need the following permissions:

1. **Amazon Bedrock**:
   - `bedrock:InvokeModel` - For Nova Lite (story generation) and Titan (image analysis)
   - Region: Ensure your configured region has Bedrock access

2. **Amazon Polly**:
   - `polly:SynthesizeSpeech` - For text-to-speech conversion
   - Region: Same as Bedrock region

### Testing Audio Generation

1. Create a new story or regenerate an existing one
2. Check Django console/logs for any errors
3. If audio still doesn't generate, check:
   - AWS credentials in `.env` file
   - AWS IAM permissions for Polly
   - Network connectivity to AWS services

## Playlist Feature

### Backend Implementation

✅ **Completed:**
- `Playlist` model with many-to-many relationship to `Story`
- `PlaylistSerializer` and `PlaylistListSerializer`
- `PlaylistViewSet` with CRUD operations
- Admin interface for playlists
- API endpoints: `/api/playlists/`

### Frontend Implementation (Next Steps)

The playlist feature needs frontend UI:
- Create playlist page
- List playlists page
- Add/remove stories from playlist
- Play playlist (sequential story playback)

### API Endpoints

- `GET /api/playlists/` - List playlists (user's own + public)
- `POST /api/playlists/` - Create playlist
- `GET /api/playlists/{id}/` - Get playlist details
- `PATCH /api/playlists/{id}/` - Update playlist
- `DELETE /api/playlists/{id}/` - Delete playlist

### Request/Response Examples

**Create Playlist:**
```json
POST /api/playlists/
{
  "name": "Bedtime Stories",
  "description": "Stories for bedtime",
  "story_ids": ["story-uuid-1", "story-uuid-2"],
  "is_public": false
}
```

**Update Playlist (add stories):**
```json
PATCH /api/playlists/{id}/
{
  "story_ids": ["story-uuid-1", "story-uuid-2", "story-uuid-3"]
}
```

