#!/usr/bin/env python
"""
Script to directly add the voice_id column to the database.
Run this if the migration isn't working.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

def add_voice_id_column():
    """Add voice_id column directly to the database."""
    with connection.cursor() as cursor:
        try:
            # Check if column already exists
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'api_story' 
                AND COLUMN_NAME = 'voice_id'
            """)
            exists = cursor.fetchone()[0] > 0
            
            if exists:
                print("✅ Column 'voice_id' already exists in api_story table")
                return True
            
            # Add the column
            print("Adding voice_id column to api_story table...")
            cursor.execute("""
                ALTER TABLE `api_story` 
                ADD COLUMN `voice_id` VARCHAR(50) NOT NULL DEFAULT 'Joanna' 
                COMMENT 'Amazon Polly voice ID for narration (e.g., Joanna, Matthew, Ivy)'
            """)
            print("✅ Successfully added voice_id column!")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            print("\nTrying alternative SQL...")
            try:
                # Try without the COMMENT
                cursor.execute("""
                    ALTER TABLE `api_story` 
                    ADD COLUMN `voice_id` VARCHAR(50) NOT NULL DEFAULT 'Joanna'
                """)
                print("✅ Successfully added voice_id column (without comment)!")
                return True
            except Exception as e2:
                print(f"❌ Alternative also failed: {e2}")
                return False

if __name__ == '__main__':
    print("=" * 60)
    print("Adding voice_id column to api_story table")
    print("=" * 60)
    
    success = add_voice_id_column()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Column added successfully!")
        print("Now restart your Django server and the error should be gone.")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ Failed to add column. Please run the SQL manually:")
        print("=" * 60)
        print("""
ALTER TABLE `api_story` 
ADD COLUMN `voice_id` VARCHAR(50) NOT NULL DEFAULT 'Joanna';
        """)

