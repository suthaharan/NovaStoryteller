#!/bin/bash

# Script to rename all markdown files in migrationdocs/ folder
# to follow the numbered naming convention based on chronological order

set -e

MIGRATION_DOCS_DIR="migrationdocs"

if [ ! -d "$MIGRATION_DOCS_DIR" ]; then
    echo "Error: $MIGRATION_DOCS_DIR directory not found!"
    exit 1
fi

cd "$MIGRATION_DOCS_DIR"

echo "Renaming markdown files in chronological order..."
echo ""

counter=1
# Sort by modification time (newest first), exclude README.md
ls -1t *.md | grep -v "^README.md$" | while read file; do
    # Extract filename without any number prefix if it exists
    # Handle both NNN-name.md and NNN-NNN-name.md patterns
    clean_name=$(echo "$file" | sed -E 's/^[0-9]+-([0-9]+-)?//')
    
    # Generate new name with 3-digit number
    newname=$(printf "%03d-%s" $counter "$clean_name")
    
    if [ "$file" != "$newname" ]; then
        mv "$file" "$newname"
        echo "✓ Renamed: $file -> $newname"
    else
        echo "  Skipped: $file (already correctly named)"
    fi
    counter=$((counter+1))
done

echo ""
echo "✅ Renaming complete!"
echo ""
echo "Current files:"
ls -1 *.md | head -10

