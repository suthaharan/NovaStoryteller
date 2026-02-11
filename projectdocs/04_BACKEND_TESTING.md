# Backend Testing Guide - Step by Step

This guide will help you test the backend installation and verify all APIs are working before building the frontend.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Python 3.10+ installed
- [ ] MySQL 8+ installed and running (or SQLite for development)
- [ ] AWS account with Bedrock access
- [ ] AWS credentials configured

---

## Step 1: Environment Setup

### 1.1 Check Python Version
```bash
python3 --version
# Should be Python 3.10 or higher
```

### 1.2 Navigate to Project Directory
```bash
cd /Users/kurinchi/valet/novastoryteller
```

### 1.3 Create/Activate Virtual Environment
```bash
# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows
```

### 1.4 Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected Output:**
- All packages should install without errors
- Key packages: Django, djangorestframework, boto3, PyMySQL, Pillow

---

## Step 2: Environment Variables Configuration

### 2.1 Create/Update `.env` File
```bash
# Copy example if exists, or create new
cp .env.example .env  # If example exists
# OR create manually
nano .env  # or use your preferred editor
```

### 2.2 Required Environment Variables
Add the following to your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=novastoryteller
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
# OR use SQLite for development
USE_SQLITE=true

# AWS Configuration (Required for Nova AI)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_BEDROCK_REGION=us-east-1

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 2.3 Generate Django Secret Key (if needed)
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

---

## Step 3: Database Setup

### 3.1 Create MySQL Database (if using MySQL)
```bash
mysql -u root -p
```

In MySQL console:
```sql
CREATE DATABASE novastoryteller CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON novastoryteller.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3.2 Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

**Expected Output:**
- All migrations should apply successfully
- No errors about missing tables

### 3.3 Verify Database Tables
```bash
python manage.py showmigrations
```

**Check for:**
- `api_story` table should be listed
- All migrations should show `[X]` (applied)

---

## Step 4: Create Superuser

### 4.1 Create Admin User
```bash
python manage.py createsuperuser
```

**Enter:**
- Username: admin (or your choice)
- Email: admin@example.com
- Password: (choose a strong password)

### 4.2 Verify Superuser Creation
```bash
python manage.py shell
```

In Django shell:
```python
from django.contrib.auth import get_user_model
User = get_user_model()
print(User.objects.filter(is_superuser=True).count())
# Should output: 1
exit()
```

---

## Step 5: Seed Test Data (Optional)

### 5.1 Run Seeder
```bash
python manage.py seed_data
```

**Expected Output:**
- Test users created
- Test stories created
- Categories, items, etc. created
- No errors

### 5.2 Verify Seeded Data
```bash
python manage.py shell
```

```python
from api.models import Story, User
print(f"Users: {User.objects.count()}")
print(f"Stories: {Story.objects.count()}")
exit()
```

---

## Step 6: Test Nova Service

### 6.1 Run Nova Test Script
```bash
python scripts/test_nova.py
```

**Expected Output:**
```
✅ Nova Service initialized successfully
✅ Story generation test passed
✅ Speech synthesis test passed (if configured)
```

**If errors occur:**
- Check AWS credentials in `.env`
- Verify Bedrock access in AWS console
- Check network connectivity

### 6.2 Manual Nova Service Test
```bash
python manage.py shell
```

```python
from api.nova_service import NovaService

# Test initialization
try:
    nova = NovaService()
    print("✅ Nova Service initialized")
except Exception as e:
    print(f"❌ Error: {e}")

# Test story generation
try:
    story = nova.generate_story(
        prompt="Tell me a short story about a brave astronaut",
        template="adventure"
    )
    print(f"✅ Story generated: {len(story)} characters")
    print(story[:200] + "...")
except Exception as e:
    print(f"❌ Error: {e}")

# Test text-to-speech (requires AWS credentials)
try:
    audio = nova.synthesize_speech("Hello, this is a test.")
    print(f"✅ Audio generated: {len(audio)} bytes")
except Exception as e:
    print(f"❌ Error: {e}")

exit()
```

---

## Step 7: Start Django Development Server

### 7.1 Start Server
```bash
python manage.py runserver
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### 7.2 Test Server Response
Open browser or use curl:
```bash
curl http://127.0.0.1:8000/api/
```

**Expected:** Should return API response (may be 404 or API root)

---

## Step 8: Test API Endpoints

### 8.1 Test Authentication Endpoints

#### Register User
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123",
    "confirm_password": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "user",
    "accept_terms": true
  }'
```

**Note:** Registration requires:
- `confirm_password`: Must match `password`
- `user_type`: Either `"admin"` (superuser), `"staff"` (staff user), or `"user"` (regular user)
- `accept_terms`: Must be `true`

**Expected:** Returns user data with token

#### Login User
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

**Expected:** Returns user data with authentication token

**Save the token** for next requests:
```bash
export TOKEN="your_token_here"
```

### 8.2 Test Story Endpoints

#### List Stories
```bash
curl -X GET http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN"
```

**Expected:** Returns list of stories (may be empty)

#### Create Story
```bash
curl -X POST http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Story",
    "prompt": "Tell me a story about a brave astronaut",
    "template": "adventure"
  }'
```

**Expected:**
- Story created successfully
- `story_text` generated (if Nova AI configured)
- `audio_file` generated (if Nova AI configured)
- Returns story data with ID

**Note:** Story generation may take 10-30 seconds depending on Nova AI response time.

#### Get Story Details
```bash
# Replace {story_id} with actual ID from create response
curl -X GET http://127.0.0.1:8000/api/stories/{story_id}/ \
  -H "Authorization: Token $TOKEN"
```

**Expected:** Returns full story details including:
- `story_text`
- `audio_url` (if audio generated)
- `image_url` (if image uploaded)

#### Regenerate Story
```bash
curl -X POST http://127.0.0.1:8000/api/stories/{story_id}/regenerate/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "modifications": "Make the astronaut have a pet robot"
  }'
```

**Expected:** Story regenerated with modifications

### 8.3 Test Other Endpoints

#### Get User Profile
```bash
curl -X GET http://127.0.0.1:8000/api/user/profile/ \
  -H "Authorization: Token $TOKEN"
```

#### List Categories
```bash
curl -X GET http://127.0.0.1:8000/api/categories/ \
  -H "Authorization: Token $TOKEN"
```

#### List Items
```bash
curl -X GET http://127.0.0.1:8000/api/items/ \
  -H "Authorization: Token $TOKEN"
```

---

## Step 9: Test File Uploads

### 9.1 Upload Story Image
```bash
curl -X POST http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN" \
  -F "title=Story with Image" \
  -F "prompt=Tell me a story about this image" \
  -F "template=adventure" \
  -F "image=@/path/to/test/image.jpg"
```

**Expected:**
- Image uploaded successfully
- Image path stored in `year/month` directory structure
- Image description generated (if Nova AI configured)

### 9.2 Verify Image Storage
```bash
ls -la media/stories/$(date +%Y)/$(date +%m)/
```

**Expected:** Should see uploaded image file

---

## Step 10: Test Admin Interface

### 10.1 Access Admin Panel
Open browser:
```
http://127.0.0.1:8000/admin/
```

### 10.2 Login with Superuser
- Username: (your superuser username)
- Password: (your superuser password)

### 10.3 Verify Models
Check that you can see:
- Stories
- Users
- Categories
- Items
- Other models

### 10.4 Test Story Creation in Admin
1. Go to Stories → Add Story
2. Fill in required fields
3. Save
4. Verify story appears in list

---

## Step 11: Verify Audio Generation

### 11.1 Check Audio Files
After creating a story with Nova AI:
```bash
find media/stories/audio -name "*.mp3" -type f
```

**Expected:** Should see generated audio files

### 11.2 Test Audio URL
```bash
# Get story details
curl -X GET http://127.0.0.1:8000/api/stories/{story_id}/ \
  -H "Authorization: Token $TOKEN"
```

**Check:**
- `audio_url` field should contain valid URL
- URL should be accessible: `http://127.0.0.1:8000{audio_url}`

---

## Step 12: API Documentation (Optional)

### 12.1 Access DRF Browsable API
Open browser:
```
http://127.0.0.1:8000/api/
```

### 12.2 Test Endpoints via Browser
- Click on endpoints
- Test GET, POST, PUT, DELETE operations
- Verify responses

---

## Step 13: Performance & Error Testing

### 13.1 Test Error Handling

#### Invalid Token
```bash
curl -X GET http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token invalid_token"
```

**Expected:** 401 Unauthorized

#### Missing Required Fields
```bash
curl -X POST http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'
```

**Expected:** 400 Bad Request with validation errors

### 13.2 Test Pagination
```bash
curl -X GET "http://127.0.0.1:8000/api/stories/?page=1&page_size=10" \
  -H "Authorization: Token $TOKEN"
```

**Expected:** Paginated response

---

## Step 14: Final Verification Checklist

Before proceeding to frontend development, verify:

- [ ] ✅ Virtual environment activated
- [ ] ✅ All dependencies installed
- [ ] ✅ Environment variables configured
- [ ] ✅ Database created and migrated
- [ ] ✅ Superuser created
- [ ] ✅ Test data seeded (optional)
- [ ] ✅ Nova service working (if AWS configured)
- [ ] ✅ Django server running
- [ ] ✅ User registration works
- [ ] ✅ User login works
- [ ] ✅ Story creation works
- [ ] ✅ Story listing works
- [ ] ✅ Story detail retrieval works
- [ ] ✅ Story regeneration works
- [ ] ✅ Image upload works
- [ ] ✅ Audio generation works (if Nova configured)
- [ ] ✅ Admin interface accessible
- [ ] ✅ Error handling works
- [ ] ✅ Authentication required for protected endpoints

---

## Troubleshooting

### Common Issues

**Issue:** `ModuleNotFoundError: No module named 'api'`
- **Solution:** Ensure you're in project root directory
- **Solution:** Check `PYTHONPATH` or use `python manage.py` commands

**Issue:** `django.core.exceptions.ImproperlyConfigured: mysqlclient`
- **Solution:** Ensure PyMySQL is installed and configured in `backend/__init__.py`

**Issue:** `Connection refused` for database
- **Solution:** Check MySQL is running: `mysql.server start`
- **Solution:** Verify database credentials in `.env`

**Issue:** `AWS credentials not found`
- **Solution:** Check `.env` file has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- **Solution:** Verify credentials are valid in AWS console

**Issue:** `No audio generated`
- **Solution:** Check Nova service is configured correctly
- **Solution:** Verify AWS Bedrock access
- **Solution:** Check error logs in Django console

**Issue:** `Permission denied` for media files
- **Solution:** Check file permissions: `chmod -R 755 media/`
- **Solution:** Ensure `MEDIA_ROOT` directory exists and is writable

---

## Next Steps

Once all tests pass:

1. ✅ **Backend is ready** - All APIs are working
2. 🚀 **Proceed to Frontend** - Start building React frontend
3. 📝 **API Documentation** - Document any custom endpoints
4. 🔒 **Security Review** - Review authentication and authorization
5. 🧪 **Integration Testing** - Test frontend-backend integration

---

## Quick Test Script

Save this as `test_backend.sh`:

```bash
#!/bin/bash

echo "🧪 Testing Backend Installation..."

# Test 1: Python version
echo "1. Checking Python version..."
python3 --version

# Test 2: Virtual environment
echo "2. Checking virtual environment..."
if [ -d "venv" ]; then
    echo "✅ Virtual environment exists"
else
    echo "❌ Virtual environment not found"
fi

# Test 3: Dependencies
echo "3. Checking dependencies..."
source venv/bin/activate
pip list | grep -E "Django|djangorestframework|boto3"

# Test 4: Database migrations
echo "4. Checking migrations..."
python manage.py showmigrations | grep -E "\[X\]"

# Test 5: Server
echo "5. Testing server..."
python manage.py check

echo "✅ Backend testing complete!"
```

Make executable and run:
```bash
chmod +x test_backend.sh
./test_backend.sh
```

