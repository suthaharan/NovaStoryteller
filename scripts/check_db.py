#!/usr/bin/env python3
"""
Script to check database connection and create database if needed.
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

try:
    # Try to connect to MySQL server (without specifying database)
    print(f"Connecting to MySQL server at {db_host}:{db_port}...")
    connection = MySQLdb.connect(
        host=db_host,
        port=int(db_port),
        user=db_user,
        passwd=db_password
    )
    print("✓ Successfully connected to MySQL server")
    
    # Check if database exists
    cursor = connection.cursor()
    cursor.execute("SHOW DATABASES LIKE %s", (db_name,))
    result = cursor.fetchone()
    
    if result:
        print(f"✓ Database '{db_name}' already exists")
    else:
        print(f"✗ Database '{db_name}' does not exist")
        create = input(f"Create database '{db_name}'? (y/n): ")
        if create.lower() == 'y':
            cursor.execute(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✓ Database '{db_name}' created successfully")
        else:
            print("Database creation cancelled")
            sys.exit(1)
    
    cursor.close()
    connection.close()
    print("\n✓ Database is ready!")
    print("You can now run: python manage.py migrate")
    
except MySQLdb.Error as e:
    print(f"✗ Database connection failed: {e}")
    print("\nPlease check:")
    print(f"  1. MySQL server is running on {db_host}:{db_port}")
    print(f"  2. Username: {db_user}")
    print(f"  3. Password is correct")
    print(f"  4. Database '{db_name}' exists or can be created")
    sys.exit(1)


