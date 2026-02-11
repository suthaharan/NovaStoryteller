# Quick Backend Test Checklist

A quick reference checklist for testing the backend before frontend development.

## Pre-Flight Checks

```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Check environment variables
cat .env | grep -E "AWS_|DB_|SECRET_KEY"

# 4. Run migrations
python manage.py migrate

# 5. Create superuser (if not exists)
python manage.py createsuperuser
```

## Quick Tests

### Test 1: Server Starts
```bash
python manage.py runserver
# Should see: "Starting development server at http://127.0.0.1:8000/"
```

### Test 2: Health Check
```bash
curl http://127.0.0.1:8000/api/health-check/
# Should return: {"status": "ok"}
```

### Test 3: User Registration
```bash
curl -X POST http://127.0.0.1:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username":"test",
    "email":"test@test.com",
    "password":"test123",
    "confirm_password":"test123",
    "first_name":"Test",
    "last_name":"User",
    "user_type":"user",
    "accept_terms":true
  }'
```

### Test 4: User Login
```bash
curl -X POST http://127.0.0.1:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
# Save the token from response
```

### Test 5: Create Story (with token)
```bash
export TOKEN="your_token_here"
curl -X POST http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Story","prompt":"Tell me a story","template":"adventure"}'
```

### Test 6: List Stories
```bash
curl -X GET http://127.0.0.1:8000/api/stories/ \
  -H "Authorization: Token $TOKEN"
```

## Automated Test Script

```bash
# Run comprehensive API tests
python scripts/test_api_endpoints.py
```

## Nova AI Test

```bash
# Test Nova service
python scripts/test_nova.py
```

## All Tests Pass? ✅

If all tests pass, you're ready to:
1. ✅ Start frontend development
2. ✅ Integrate React with backend APIs
3. ✅ Build user interface

## Common Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Activate venv: `source venv/bin/activate` |
| `Connection refused` | Start MySQL: `mysql.server start` |
| `AWS credentials not found` | Check `.env` file has AWS keys |
| `Table doesn't exist` | Run: `python manage.py migrate` |
| `Permission denied` | Check file permissions: `chmod -R 755 media/` |

