#!/usr/bin/env python
"""
Script to verify URL patterns are correctly configured.
Run this to check if /api/login/ is registered.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Error setting up Django: {e}")
    sys.exit(1)

print("=" * 60)
print("Verifying URL Configuration")
print("=" * 60)

# Test 1: Import API URLs
try:
    from api.urls import urlpatterns as api_urls
    print("✅ Successfully imported api.urls")
    print(f"   Found {len(api_urls)} URL patterns")
    
    # Check for login pattern
    login_patterns = [p for p in api_urls if hasattr(p, 'name') and p.name == 'login']
    if login_patterns:
        print(f"✅ Login URL pattern found: {login_patterns[0].pattern}")
    else:
        print("❌ Login URL pattern NOT found in api.urls")
        print("   Available patterns:")
        for p in api_urls:
            if hasattr(p, 'name'):
                print(f"     - {p.pattern} (name: {p.name})")
except Exception as e:
    print(f"❌ Error importing api.urls: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 2: Import API Views
try:
    from api.views import login
    print("✅ Successfully imported api.views.login")
    print(f"   Function: {login.__name__}")
except Exception as e:
    print(f"❌ Error importing api.views.login: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check Main URL Configuration
try:
    from backend.urls import urlpatterns as main_urls
    print("✅ Successfully imported backend.urls")
    print(f"   Found {len(main_urls)} URL patterns")
    
    # Check for api/ include
    api_includes = [p for p in main_urls if 'api' in str(p.pattern)]
    if api_includes:
        print(f"✅ API include found: {api_includes[0].pattern}")
    else:
        print("❌ API include NOT found in backend.urls")
except Exception as e:
    print(f"❌ Error importing backend.urls: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Try to resolve the URL
try:
    from django.urls import get_resolver
    resolver = get_resolver()
    
    print("\n" + "=" * 60)
    print("Testing URL Resolution")
    print("=" * 60)
    
    # Try to resolve /api/login/
    try:
        match = resolver.resolve('/api/login/')
        print(f"✅ Successfully resolved /api/login/")
        print(f"   View function: {match.func.__name__}")
        print(f"   URL name: {match.url_name if hasattr(match, 'url_name') else 'N/A'}")
        print(f"   Args: {match.args}")
        print(f"   Kwargs: {match.kwargs}")
    except Exception as e:
        print(f"❌ Failed to resolve /api/login/: {e}")
        print("\n   Trying to find what URLs are registered...")
        
        # List all registered URLs
        try:
            from django.urls import get_resolver
            resolver = get_resolver()
            print("\n   Registered URL patterns:")
            for pattern in resolver.url_patterns:
                print(f"     - {pattern.pattern}")
        except:
            pass
        
except Exception as e:
    print(f"❌ Error during URL resolution test: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("Verification Complete")
print("=" * 60)


