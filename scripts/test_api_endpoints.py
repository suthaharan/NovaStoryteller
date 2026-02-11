#!/usr/bin/env python
"""
Test script for API endpoints.

This script tests all API endpoints to ensure they're working correctly.
Run this after setting up the backend to verify all APIs are functional.

Usage:
    python scripts/test_api_endpoints.py
"""

import os
import sys
import django
import requests
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

# Configuration
BASE_URL = "http://127.0.0.1:8000"
API_BASE = f"{BASE_URL}/api"

# Test results
results = {
    'passed': [],
    'failed': [],
    'skipped': []
}


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_success(message):
    """Print success message."""
    print(f"✅ {message}")


def print_error(message):
    """Print error message."""
    print(f"❌ {message}")


def print_info(message):
    """Print info message."""
    print(f"ℹ️  {message}")


def test_endpoint(name, method, url, headers=None, data=None, expected_status=200):
    """Test an API endpoint."""
    try:
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        elif method.upper() == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method.upper() == 'PUT':
            response = requests.put(url, headers=headers, json=data)
        elif method.upper() == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            results['skipped'].append(f"{name} - Unknown method: {method}")
            return None
        
        if response.status_code == expected_status:
            results['passed'].append(name)
            print_success(f"{name} - Status: {response.status_code}")
            return response
        else:
            results['failed'].append(f"{name} - Expected {expected_status}, got {response.status_code}")
            print_error(f"{name} - Status: {response.status_code}")
            if response.text:
                # Try to parse JSON error response
                try:
                    error_data = response.json()
                    if 'details' in error_data:
                        print_info(f"Validation errors: {error_data['details']}")
                    elif 'error' in error_data:
                        print_info(f"Error: {error_data['error']}")
                    else:
                        print_info(f"Response: {response.text[:200]}")
                except:
                    print_info(f"Response: {response.text[:200]}")
            return None
            
    except requests.exceptions.ConnectionError:
        results['failed'].append(f"{name} - Connection refused (is server running?)")
        print_error(f"{name} - Connection refused. Is Django server running?")
        return None
    except Exception as e:
        results['failed'].append(f"{name} - Error: {str(e)}")
        print_error(f"{name} - Error: {str(e)}")
        return None


def test_authentication():
    """Test authentication endpoints."""
    print_header("Testing Authentication Endpoints")
    
    # Generate unique test user to avoid conflicts
    import time
    timestamp = int(time.time())
    test_user = {
        "username": f"apitestuser{timestamp}",
        "email": f"apitest{timestamp}@example.com",
        "password": "testpass123",
        "confirm_password": "testpass123",
        "first_name": "API",
        "last_name": "Test",
        "user_type": "user",  # Options: 'admin', 'staff', or 'user'
        "accept_terms": True
    }
    
    response = test_endpoint(
        "User Registration",
        "POST",
        f"{API_BASE}/register/",
        data=test_user,
        expected_status=201
    )
    
    if response and response.status_code == 201:
        token = response.json().get('token')
        print_info(f"Registration token: {token[:20]}...")
        return token
    
    # Fallback: Try to get existing test user's token (if registration failed)
    # This handles the case where user already exists from previous test run
    try:
        # Try with timestamp-based email first
        user = User.objects.get(email=test_user['email'])
        token, _ = Token.objects.get_or_create(user=user)
        print_info(f"Using existing user token: {token.key[:20]}...")
        return token.key
    except User.DoesNotExist:
        # Fallback to any test user
        try:
            user = User.objects.filter(username__startswith='apitestuser').first()
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                print_info(f"Using existing test user token: {token.key[:20]}...")
                return token.key
        except:
            pass
    
    print_error("Could not create or find test user")
    return None


def test_story_endpoints(token):
    """Test story endpoints."""
    print_header("Testing Story Endpoints")
    
    headers = {"Authorization": f"Token {token}"}
    
    # Test list stories
    response = test_endpoint(
        "List Stories",
        "GET",
        f"{API_BASE}/stories/",
        headers=headers
    )
    
    # Test create story
    story_data = {
        "title": "API Test Story",
        "prompt": "Tell me a short story about a brave astronaut",
        "template": "adventure"
    }
    
    response = test_endpoint(
        "Create Story",
        "POST",
        f"{API_BASE}/stories/",
        headers=headers,
        data=story_data,
        expected_status=201
    )
    
    story_id = None
    if response and response.status_code == 201:
        story_id = response.json().get('id')
        print_info(f"Created story ID: {story_id}")
    
    # Test get story detail
    if story_id:
        test_endpoint(
            "Get Story Detail",
            "GET",
            f"{API_BASE}/stories/{story_id}/",
            headers=headers
        )
    
    return story_id


def test_other_endpoints(token):
    """Test other API endpoints."""
    print_header("Testing Other Endpoints")
    
    headers = {"Authorization": f"Token {token}"}
    
    # Test user profile
    test_endpoint(
        "Get User Profile",
        "GET",
        f"{API_BASE}/profile/",
        headers=headers
    )
    
    # Test categories
    test_endpoint(
        "List Categories",
        "GET",
        f"{API_BASE}/categories/",
        headers=headers
    )
    
    # Test items
    test_endpoint(
        "List Items",
        "GET",
        f"{API_BASE}/items/",
        headers=headers
    )


def test_error_handling(token):
    """Test error handling."""
    print_header("Testing Error Handling")
    
    # Test invalid token
    test_endpoint(
        "Invalid Token",
        "GET",
        f"{API_BASE}/stories/",
        headers={"Authorization": "Token invalid_token"},
        expected_status=401
    )
    
    # Test missing required fields
    test_endpoint(
        "Missing Required Fields",
        "POST",
        f"{API_BASE}/stories/",
        headers={"Authorization": f"Token {token}"},
        data={"title": "Incomplete"},
        expected_status=400
    )


def print_summary():
    """Print test summary."""
    print_header("Test Summary")
    
    total = len(results['passed']) + len(results['failed']) + len(results['skipped'])
    
    print(f"Total Tests: {total}")
    print_success(f"Passed: {len(results['passed'])}")
    print_error(f"Failed: {len(results['failed'])}")
    print_info(f"Skipped: {len(results['skipped'])}")
    
    if results['failed']:
        print("\n❌ Failed Tests:")
        for test in results['failed']:
            print(f"  - {test}")
    
    if results['skipped']:
        print("\n⏭️  Skipped Tests:")
        for test in results['skipped']:
            print(f"  - {test}")
    
    success_rate = (len(results['passed']) / total * 100) if total > 0 else 0
    print(f"\nSuccess Rate: {success_rate:.1f}%")
    
    if len(results['failed']) == 0:
        print("\n🎉 All tests passed! Backend is ready for frontend development.")
    else:
        print("\n⚠️  Some tests failed. Please fix issues before proceeding.")


def main():
    """Main test function."""
    print_header("API Endpoints Test Suite")
    print_info("Make sure Django server is running: python manage.py runserver")
    print_info("Press Ctrl+C to cancel, or Enter to continue...")
    
    try:
        input()
    except KeyboardInterrupt:
        print("\nTest cancelled.")
        return
    
    # Test authentication
    token = test_authentication()
    
    if not token:
        print_error("Authentication failed. Cannot proceed with other tests.")
        print_summary()
        return
    
    # Test story endpoints
    story_id = test_story_endpoints(token)
    
    # Test other endpoints
    test_other_endpoints(token)
    
    # Test error handling
    test_error_handling(token)
    
    # Print summary
    print_summary()


if __name__ == "__main__":
    main()

