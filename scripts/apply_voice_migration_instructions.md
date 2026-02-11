# How to Apply the voice_id Migration

## Quick Fix: Run SQL Directly

If the Django migration command isn't working, you can run the SQL directly:

### Option 1: Using MySQL Command Line

```bash
mysql -u YOUR_USERNAME -p YOUR_DATABASE_NAME < scripts/add_voice_id_column.sql
```

Or connect to MySQL and run:

```sql
ALTER TABLE `api_story` 
ADD COLUMN `voice_id` VARCHAR(50) NOT NULL DEFAULT 'Joanna' 
COMMENT 'Amazon Polly voice ID for narration (e.g., Joanna, Matthew, Ivy)';
```

### Option 2: Using Django Migration (Preferred)

1. **Stop your Django server** (Ctrl+C)

2. **Run the migration:**
   ```bash
   cd /Users/kurinchi/valet/novastoryteller
   source venv/bin/activate
   python manage.py migrate api
   ```

3. **If you get "models have changes" error:**
   ```bash
   python manage.py makemigrations api
   python manage.py migrate api
   ```

4. **Restart your Django server:**
   ```bash
   python manage.py runserver
   ```

### Option 3: Mark Migration as Applied (if you ran SQL directly)

If you ran the SQL directly, mark the migration as applied:

```bash
python manage.py migrate api 0016_story_voice_id --fake
```

## Verify It Worked

After applying the migration, check:

1. The error should be gone
2. You can access `/api/stories/` without errors
3. The voice selection dropdown should appear in the story detail page

## Troubleshooting

If you still see errors:

1. **Check if column exists:**
   ```sql
   SHOW COLUMNS FROM api_story LIKE 'voice_id';
   ```

2. **If column doesn't exist, run the SQL again**

3. **If column exists but Django still errors, restart the server**

