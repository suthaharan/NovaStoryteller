#!/usr/bin/env python3
"""
Quick script to verify .env file is being read correctly.
Run this to see what Django will use for database connection.
"""
import os
import sys
from pathlib import Path

# Simulate Django's settings loading
project_root = Path(__file__).resolve().parent.parent
from dotenv import load_dotenv
load_dotenv(project_root / '.env')

print("\n" + "="*60)
print("ENVIRONMENT VARIABLES CHECK")
print("="*60)

# Show what's in .env
print("\n1. Raw Environment Variables:")
print("-" * 60)
vars_to_check = ['DB_NAME', 'DB_DATABASE', 'DB_USER', 'DB_USERNAME', 
                 'DB_PASSWORD', 'DB_HOST', 'DB_PORT']
for var in vars_to_check:
    value = os.getenv(var)
    if var == 'DB_PASSWORD':
        print(f"   {var:15} = {'***SET***' if value else 'NOT SET'}")
    else:
        print(f"   {var:15} = {value or 'NOT SET'}")

# Show what Django will use
print("\n2. What Django Settings Will Use:")
print("-" * 60)
db_name = os.getenv('DB_NAME', os.getenv('DB_DATABASE', 'mydb'))
db_user = os.getenv('DB_USER', os.getenv('DB_USERNAME', 'myuser'))
db_password = os.getenv('DB_PASSWORD', 'mypassword')
db_host = os.getenv('DB_HOST', 'localhost')
db_port = os.getenv('DB_PORT', '3306')

if ':' in db_host:
    db_host, db_port = db_host.split(':', 1)

print(f"   Database: {db_name}")
print(f"   User:     {db_user}")
print(f"   Host:     {db_host}")
print(f"   Port:     {db_port}")
print(f"   Password: {'***SET***' if db_password and db_password != 'mypassword' else '⚠️  NOT SET or using default!'}")

print("\n3. Connection Test:")
print("-" * 60)
try:
    import MySQLdb
    conn = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password,
        db=db_name
    )
    print("   ✓ Connection successful!")
    conn.close()
except Exception as e:
    print(f"   ✗ Connection failed: {e}")
    print("\n   💡 TIP: The password in your .env file might not match")
    print("      the MySQL root password. Check your .env file:")
    print(f"      DB_PASSWORD=your_actual_mysql_password")

print("\n" + "="*60 + "\n")


