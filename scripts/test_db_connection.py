#!/usr/bin/env python3
"""
Test database connection with detailed error messages.
"""
import os
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(project_root / '.env')

import MySQLdb

# Get database configuration
db_name = os.getenv('DB_NAME', os.getenv('DB_DATABASE', 'eagleview'))
db_user = os.getenv('DB_USER', os.getenv('DB_USERNAME', 'root'))
db_password = os.getenv('DB_PASSWORD', 'password')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')

# Parse host if it contains port
if ':' in db_host:
    db_host, db_port = db_host.split(':', 1)

print("=" * 60)
print("Database Connection Test")
print("=" * 60)
print(f"Host: {db_host}")
print(f"Port: {db_port}")
print(f"User: {db_user}")
print(f"Password: {'*' * len(db_password) if db_password else '(empty)'}")
print(f"Database: {db_name}")
print("=" * 60)
print()

# Test 1: Try connecting without database (to check server access)
print("Test 1: Connecting to MySQL server (without database)...")
try:
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password
    )
    print("✓ Successfully connected to MySQL server")
    conn.close()
except MySQLdb.Error as e:
    print(f"✗ Failed to connect to MySQL server: {e}")
    print("\nPossible issues:")
    print("  1. MySQL server is not running")
    print("  2. Wrong host/port")
    print("  3. Wrong username/password")
    print("  4. Firewall blocking connection")
    sys.exit(1)

# Test 2: Check if database exists
print("\nTest 2: Checking if database exists...")
try:
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password
    )
    cursor = conn.cursor()
    cursor.execute("SHOW DATABASES LIKE %s", (db_name,))
    result = cursor.fetchone()
    if result:
        print(f"✓ Database '{db_name}' exists")
    else:
        print(f"✗ Database '{db_name}' does NOT exist")
        print(f"\nTo create it, run:")
        print(f"  mysql -h {db_host} -P {db_port} -u {db_user} -p")
        print(f"  CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    cursor.close()
    conn.close()
except MySQLdb.Error as e:
    print(f"✗ Error checking database: {e}")
    sys.exit(1)

# Test 3: Try connecting with database
print(f"\nTest 3: Connecting to database '{db_name}'...")
try:
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password,
        db=db_name
    )
    print(f"✓ Successfully connected to database '{db_name}'")
    conn.close()
    print("\n" + "=" * 60)
    print("✓ All tests passed! Database is ready.")
    print("=" * 60)
except MySQLdb.Error as e:
    print(f"✗ Failed to connect to database: {e}")
    print("\nTo fix:")
    print(f"  1. Create the database: CREATE DATABASE {db_name};")
    print(f"  2. Grant permissions: GRANT ALL ON {db_name}.* TO '{db_user}'@'localhost';")
    sys.exit(1)


