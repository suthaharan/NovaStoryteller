# Quick Start Guide - Nova Storyteller

## Simple Application Flow

### For Users

1. **Register** → Create account with email/password
2. **Login** → Sign in to access dashboard
3. **Create Story** → Choose template, enter prompt (voice or text), optionally upload image
4. **Listen** → Story is generated and narrated automatically
5. **Save** → Story is saved to "My Stories"
6. **View/Edit** → Access saved stories anytime

### For Superadmin

1. **Access Admin** → Go to `/admin/` and login
2. **Manage Users** → View, edit, activate/deactivate, or delete users
3. **View All Stories** → See all stories created by all users
4. **System Settings** → Configure application settings

---

## Amazon Nova Setup Checklist

- [ ] Create AWS account
- [ ] Enable Amazon Bedrock in AWS Console
- [ ] Request access to Nova 2 Lite and Nova 2 Sonic models
- [ ] Create IAM user with Bedrock permissions
- [ ] Generate Access Key ID and Secret Access Key
- [ ] Add credentials to `.env` file
- [ ] Install boto3: `pip install boto3`
- [ ] Test connection: `python scripts/test_nova.py`

---

## Environment Variables Required

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1

# Django Settings
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=novastoryteller
DB_USER=your_user
DB_PASSWORD=your_password
```

---

## Key Features

### Story Templates
- **Adventure**: Heroes, quests, discoveries
- **Fantasy**: Magic, dragons, enchanted lands
- **Sci-Fi**: Space, robots, future tech
- **Mystery**: Clues, puzzles, detective work
- **Educational**: Learning through stories

### Voice Features
- Voice input via Web Speech API
- AI-generated narration via Nova 2 Sonic
- Real-time story adaptation
- Character voice variations

### Image Integration
- Upload drawings/photos
- AI analyzes and describes image
- Image elements woven into story

---

## Development Workflow

1. **Backend**: Django API development
   ```bash
   python manage.py runserver
   ```

2. **Frontend**: React development
   ```bash
   cd frontend
   npm run dev
   ```

3. **Production**: Build and serve
   ```bash
   ./scripts/build_frontend.sh
   python manage.py collectstatic
   python manage.py runserver
   ```

---

## Testing

### Test Nova Integration
```bash
python scripts/test_nova.py
```

### Test API Endpoints
```bash
# Register user
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Create story (with token)
curl -X POST http://localhost:8000/api/stories/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Story","prompt":"Tell me about a brave astronaut","template":"adventure"}'
```

---

## Common Issues

### AWS Bedrock Access Denied
- Check IAM user has `bedrock:InvokeModel` permission
- Verify model access is approved in Bedrock console
- Check AWS region matches in `.env`

### Story Generation Fails
- Verify AWS credentials are correct
- Check internet connection
- Review error logs in Django console

### Audio Not Playing
- Check audio file was generated
- Verify file path in database
- Check media file serving configuration

---

## File Structure

```
api/
├── models.py          # Story model
├── views.py           # Story API endpoints
├── serializers.py     # Story serializers
├── nova_service.py    # Amazon Nova integration
└── urls.py            # Story routes

frontend/src/app/(other)/stories/
├── StoriesList.jsx    # List user stories
├── CreateStory.jsx    # Create new story
├── StoryPlayer.jsx    # Play story audio
└── StoryEditor.jsx    # Edit story
```

---

## Support

For detailed implementation steps, see [IMPLEMENTATION.md](./IMPLEMENTATION.md)

