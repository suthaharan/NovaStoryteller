#!/bin/bash
# Script to apply the voice_id migration

cd "$(dirname "$0")/.."

echo "Applying migration for voice_id field..."
echo ""

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Run the migration
python manage.py migrate api

echo ""
echo "Migration complete!"
echo ""
echo "If you see any errors, you can also run the SQL directly:"
echo "ALTER TABLE api_story ADD COLUMN voice_id VARCHAR(50) NOT NULL DEFAULT 'Joanna';"

