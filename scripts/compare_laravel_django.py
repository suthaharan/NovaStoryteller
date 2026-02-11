#!/usr/bin/env python3
"""
Compare how Laravel and Django might connect differently.
"""
import os
import sys
from pathlib import Path

project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from dotenv import load_dotenv
load_dotenv(project_root / '.env')

import MySQLdb

db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')
if ':' in db_host:
    db_host, db_port = db_host.split(':', 1)

db_name = os.getenv('DB_NAME', os.getenv('DB_DATABASE', 'mydb')).strip()
db_user = os.getenv('DB_USER', os.getenv('DB_USERNAME', 'myuser')).strip()
db_password = os.getenv('DB_PASSWORD', 'mypassword').strip()

print("Testing different connection methods:")
print("=" * 70)

# Test 1: localhost (current)
print("\n1. localhost (current):")
try:
    conn = MySQLdb.connect(host='localhost', port=int(db_port), user=db_user, passwd=db_password, db=db_name)
    print("   ✓ SUCCESS")
    conn.close()
except Exception as e:
    print(f"   ✗ FAILED: {e}")

# Test 2: 127.0.0.1 (sometimes different from localhost)
print("\n2. 127.0.0.1:")
try:
    conn = MySQLdb.connect(host='127.0.0.1', port=int(db_port), user=db_user, passwd=db_password, db=db_name)
    print("   ✓ SUCCESS")
    conn.close()
except Exception as e:
    print(f"   ✗ FAILED: {e}")

# Test 3: Try with unix_socket disabled (force TCP)
print("\n3. localhost with TCP forced:")
try:
    conn = MySQLdb.connect(host='127.0.0.1', port=int(db_port), user=db_user, passwd=db_password, db=db_name, connect_timeout=5)
    print("   ✓ SUCCESS")
    conn.close()
except Exception as e:
    print(f"   ✗ FAILED: {e}")

# Test 4: Check if password needs escaping
print("\n4. Password analysis:")
print(f"   Length: {len(db_password)}")
has_double_quote = '"' in db_password
has_single_quote = "'" in db_password
print(f"   Has double quotes: {has_double_quote}")
print(f"   Has single quotes: {has_single_quote}")
print(f"   Has spaces: {' ' in db_password}")
print(f"   First 3 chars: {repr(db_password[:3])}")
print(f"   Last 3 chars: {repr(db_password[-3:])}")

# Test 5: Try with different user format
print("\n5. Testing connection without database first:")
try:
    conn = MySQLdb.connect(host='127.0.0.1', port=int(db_port), user=db_user, passwd=db_password)
    print("   ✓ Connection to server works!")
    cursor = conn.cursor()
    cursor.execute(f"SELECT USER(), DATABASE()")
    result = cursor.fetchone()
    print(f"   Current user: {result[0]}")
    conn.close()
except Exception as e:
    print(f"   ✗ FAILED: {e}")

print("\n" + "=" * 70)
print("💡 If Laravel works, check:")
print("   1. Laravel's .env format (might have quotes)")
print("   2. Laravel might be using 127.0.0.1 vs localhost")
print("   3. Check Laravel's database.php config")

