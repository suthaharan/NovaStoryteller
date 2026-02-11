#!/usr/bin/env python3
"""
Debug script to check what environment variables Django is actually using.
"""
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables the same way Django does
from dotenv import load_dotenv
load_dotenv(project_root / '.env')

print("=" * 70)
print("Environment Variables Debug")
print("=" * 70)
print(f"Project root: {project_root}")
print(f".env file exists: {(project_root / '.env').exists()}")
print()

# Check all DB-related env vars
print("Database Environment Variables:")
print("-" * 70)
env_vars = {
    'DB_NAME': os.getenv('DB_NAME'),
    'DB_DATABASE': os.getenv('DB_DATABASE'),
    'DB_USER': os.getenv('DB_USER'),
    'DB_USERNAME': os.getenv('DB_USERNAME'),
    'DB_PASSWORD': os.getenv('DB_PASSWORD'),
    'DB_HOST': os.getenv('DB_HOST'),
    'DB_PORT': os.getenv('DB_PORT'),
}

for key, value in env_vars.items():
    if key == 'DB_PASSWORD':
        display_value = '***SET***' if value else 'NOT SET'
    else:
        display_value = value if value else 'NOT SET'
    print(f"  {key:15} = {display_value}")

print()
print("What Django will use:")
print("-" * 70)

# Simulate Django's logic
db_name = os.getenv('DB_NAME', os.getenv('DB_DATABASE', 'mydb'))
db_user = os.getenv('DB_USER', os.getenv('DB_USERNAME', 'myuser'))
db_password = os.getenv('DB_PASSWORD', 'mypassword')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')

# Parse host if it contains port
if ':' in db_host:
    db_host, db_port = db_host.split(':', 1)

print(f"  Database Name: {db_name}")
print(f"  Database User: {db_user}")
print(f"  Database Host: {db_host}")
print(f"  Database Port: {db_port}")
print(f"  Database Password: {'***SET***' if db_password and db_password != 'mypassword' else 'NOT SET or using default'}")

print()
print("=" * 70)
print("Testing MySQL Connection...")
print("=" * 70)

try:
    import MySQLdb
    
    print(f"Attempting to connect to: {db_host}:{db_port}")
    print(f"User: {db_user}")
    print(f"Database: {db_name}")
    print()
    
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password,
        db=db_name
    )
    print("✓ SUCCESS! Database connection works!")
    conn.close()
    
except ImportError:
    print("✗ MySQLdb not available")
except MySQLdb.Error as e:
    print(f"✗ Connection FAILED: {e}")
    print()
    print("Troubleshooting:")
    print("  1. Check if password in .env matches MySQL root password")
    print("  2. Verify MySQL is running: docker ps | grep mysql")
    print("  3. Test connection manually:")
    print(f"     mysql -h {db_host} -P {db_port} -u {db_user} -p")
    print("  4. Check if database exists:")
    print(f"     docker exec -it dockermysqladmin-db-1 mysql -u root -p -e 'SHOW DATABASES;'")


