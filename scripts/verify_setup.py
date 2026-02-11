#!/usr/bin/env python
"""
Verification script to check if all required packages are installed correctly.
Run this before starting the Django server to ensure everything is set up.
"""
import sys

def check_package(package_name, import_name=None):
    """Check if a package is installed."""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        print(f"✓ {package_name} is installed")
        return True
    except ImportError as e:
        print(f"✗ {package_name} is NOT installed: {e}")
        return False

def main():
    print("=" * 60)
    print("EagleView Setup Verification")
    print("=" * 60)
    print(f"\nPython version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print(f"\nChecking required packages...\n")
    
    packages = [
        ("Django", "django"),
        ("Django REST Framework", "rest_framework"),
        ("Pillow", "PIL"),
        ("google-generativeai", "google.generativeai"),
        ("python-dotenv", "dotenv"),
        ("mysqlclient", "MySQLdb"),
    ]
    
    all_ok = True
    for name, import_name in packages:
        if not check_package(name, import_name):
            all_ok = False
    
    print("\n" + "=" * 60)
    if all_ok:
        print("✓ All packages are installed correctly!")
        print("\nYou can now start the Django server:")
        print("  python manage.py runserver")
    else:
        print("✗ Some packages are missing!")
        print("\nTo install missing packages, run:")
        print("  pip install -r requirements.txt")
        print("\nMake sure your virtual environment is activated:")
        print("  source venv/bin/activate  # On macOS/Linux")
        print("  venv\\Scripts\\activate     # On Windows")
    print("=" * 60)
    
    # Check GEMINI_API_KEY
    print("\nChecking environment variables...")
    try:
        from dotenv import load_dotenv
        import os
        from pathlib import Path
        
        env_path = Path(__file__).parent.parent / '.env'
        load_dotenv(env_path)
        
        api_key = os.getenv('GEMINI_API_KEY')
        if api_key:
            print(f"✓ GEMINI_API_KEY is set (length: {len(api_key)} characters)")
        else:
            print("✗ GEMINI_API_KEY is NOT set in .env file")
            print("  Add it to your .env file: GEMINI_API_KEY=your_key_here")
    except Exception as e:
        print(f"⚠ Could not check .env file: {e}")
    
    return 0 if all_ok else 1

if __name__ == '__main__':
    sys.exit(main())

