#!/usr/bin/env python
"""
Script to create a test user for login testing.
Usage: python scripts/create_test_user.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User

def create_test_user():
    """Create a test user with email and password."""
    
    # Default test user credentials
    email = 'user@test.com'
    username = 'testuser'
    password = 'password'
    first_name = 'Test'
    last_name = 'User'
    
    # Check if user already exists
    if User.objects.filter(email=email).exists():
        user = User.objects.get(email=email)
        print(f"✅ User already exists: {email}")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Active: {user.is_active}")
        print(f"   Staff: {user.is_staff}")
        
        # Update password if needed
        user.set_password(password)
        user.save()
        print(f"   Password updated to: {password}")
    else:
        # Create new user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True
        )
        print(f"✅ User created successfully!")
        print(f"   Username: {user.username}")
        print(f"   Email: {user.email}")
        print(f"   Password: {password}")
    
    print("\n" + "="*60)
    print("Test Credentials for Login:")
    print("="*60)
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("="*60)
    print("\nYou can now use these credentials to login in the React app.")
    
    return user

if __name__ == '__main__':
    try:
        create_test_user()
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


