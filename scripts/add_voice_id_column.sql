-- SQL script to add voice_id column to api_story table
-- Run this directly in your MySQL database if the migration doesn't work

-- Check if column exists first (optional - MySQL will error if it exists)
-- You can ignore the error if the column already exists

ALTER TABLE `api_story` 
ADD COLUMN `voice_id` VARCHAR(50) NOT NULL DEFAULT 'Joanna' 
COMMENT 'Amazon Polly voice ID for narration (e.g., Joanna, Matthew, Ivy)';

-- Verify the column was added
-- SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME = 'api_story' 
-- AND COLUMN_NAME = 'voice_id';

