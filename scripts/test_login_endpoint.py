#!/usr/bin/env python
"""
Test script to verify the login endpoint is configured correctly.
Run this to check if the URL routing is working.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.urls import reverse, resolve
from django.test import Client

print("=" * 60)
print("Testing Login Endpoint Configuration")
print("=" * 60)

# Test 1: Check if URL pattern exists
try:
    from api.urls import urlpatterns
    print("✅ API URLs imported successfully")
    
    # Check if login path exists
    login_paths = [p for p in urlpatterns if hasattr(p, 'name') and p.name == 'login']
    if login_paths:
        print(f"✅ Login URL pattern found: {login_paths[0].pattern}")
    else:
        print("❌ Login URL pattern not found in api/urls.py")
except Exception as e:
    print(f"❌ Error importing API URLs: {e}")
    sys.exit(1)

# Test 2: Check if view function exists
try:
    from api.views import login
    print("✅ Login view function imported successfully")
    print(f"   Function: {login.__name__}")
    print(f"   Decorators: {[d.__name__ for d in login.__dict__.get('__wrapped__', {}).get('__dict__', {}).values() if hasattr(d, '__name__')]}")
except Exception as e:
    print(f"❌ Error importing login view: {e}")
    sys.exit(1)

# Test 3: Test URL resolution
try:
    # Try to resolve the URL
    from django.urls import get_resolver
    resolver = get_resolver()
    
    # Try to match /api/login/
    match = resolver.resolve('/api/login/')
    print(f"✅ URL /api/login/ resolves to: {match.func.__name__}")
    print(f"   View: {match.func}")
    print(f"   URL name: {match.url_name if hasattr(match, 'url_name') else 'N/A'}")
except Exception as e:
    print(f"❌ Error resolving URL /api/login/: {e}")
    print("   This might mean the URL pattern isn't registered correctly")

# Test 4: Test with Django test client
try:
    client = Client()
    response = client.post('/api/login/', 
                          data={'email': 'test@test.com', 'password': 'test'},
                          content_type='application/json')
    print(f"✅ Test request to /api/login/ returned status: {response.status_code}")
    if response.status_code == 404:
        print("   ⚠️  404 error - endpoint not found. Check URL configuration.")
    elif response.status_code == 400:
        print("   ✅ Endpoint found! (400 is expected for invalid credentials)")
    elif response.status_code == 401:
        print("   ✅ Endpoint found! (401 is expected for invalid credentials)")
    else:
        print(f"   Response: {response.status_code}")
except Exception as e:
    print(f"❌ Error testing endpoint: {e}")

print("=" * 60)
print("Test complete!")
print("=" * 60)
print("\nIf you see 404 errors, try:")
print("1. Restart Django server: python manage.py runserver")
print("2. Check that api app is in INSTALLED_APPS in settings.py")
print("3. Verify backend/urls.py includes api.urls correctly")


