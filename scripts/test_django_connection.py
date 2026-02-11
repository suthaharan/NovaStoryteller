#!/usr/bin/env python3
"""
Test Django's exact database connection configuration.
"""
import os
import sys
from pathlib import Path

# Add project root
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment exactly like Django does
from dotenv import load_dotenv
load_dotenv(project_root / '.env')

# Simulate Django's database config
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')

if ':' in db_host:
    db_host, db_port = db_host.split(':', 1)

db_name = os.getenv('DB_NAME', os.getenv('DB_DATABASE', 'mydb'))
db_user = os.getenv('DB_USER', os.getenv('DB_USERNAME', 'myuser'))
db_password = os.getenv('DB_PASSWORD', 'mypassword')

print("=" * 70)
print("Django Database Configuration (Exact)")
print("=" * 70)
print(f"Host:     '{db_host}' (type: {type(db_host).__name__})")
print(f"Port:     '{db_port}' (type: {type(db_port).__name__})")
print(f"Database: '{db_name}'")
print(f"User:     '{db_user}'")
print(f"Password: '{db_password[:3]}...' (length: {len(db_password)})")
print()

# Check for whitespace issues
if db_password != db_password.strip():
    print("⚠️  WARNING: Password has leading/trailing whitespace!")
    print(f"   Original: '{db_password}'")
    print(f"   Stripped: '{db_password.strip()}'")
    db_password = db_password.strip()

if db_host != db_host.strip():
    print("⚠️  WARNING: Host has whitespace!")
    db_host = db_host.strip()

if db_user != db_user.strip():
    print("⚠️  WARNING: User has whitespace!")
    db_user = db_user.strip()

print("=" * 70)
print("Testing Connection with MySQLdb (Django's connector)")
print("=" * 70)

try:
    import MySQLdb
    
    # Try connection exactly as Django does
    print(f"Connecting to: {db_host}:{int(db_port)}")
    print(f"User: {db_user}, Database: {db_name}")
    print()
    
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password,
        db=db_name
    )
    print("✓ SUCCESS! Connection works with MySQLdb")
    conn.close()
    
except MySQLdb.Error as e:
    print(f"✗ FAILED: {e}")
    print()
    print("Trying alternative connection methods...")
    print()
    
    # Try with explicit charset
    try:
        print("Attempt 2: With charset=utf8mb4")
        conn = MySQLdb.connect(
            host=db_host,
            port=int(db_port),
            user=db_user,
            passwd=db_password,
            db=db_name,
            charset='utf8mb4'
        )
        print("✓ SUCCESS with charset!")
        conn.close()
    except Exception as e2:
        print(f"✗ Also failed: {e2}")
    
    # Try without database first
    try:
        print("\nAttempt 3: Connect without database, then select")
        conn = MySQLdb.connect(
            host=db_host,
            port=int(db_port),
            user=db_user,
            passwd=db_password
        )
        print("✓ Connection to server works!")
        cursor = conn.cursor()
        cursor.execute(f"USE {db_name}")
        print("✓ Database selection works!")
        conn.close()
    except Exception as e3:
        print(f"✗ Failed: {e3}")

print()
print("=" * 70)


