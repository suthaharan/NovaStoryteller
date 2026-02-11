#!/bin/bash
# Script to create the database in the Docker MySQL container

CONTAINER_NAME="dockermysqladmin-db-1"
DB_NAME="eagleview"

echo "Creating database '$DB_NAME' in container '$CONTAINER_NAME'..."

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "✗ Container '$CONTAINER_NAME' is not running!"
    echo "  Start it with: docker start $CONTAINER_NAME"
    exit 1
fi

echo "✓ Container is running"
echo ""
echo "To create the database, run one of these commands:"
echo ""
echo "Option 1: Interactive (will prompt for password):"
echo "  docker exec -it $CONTAINER_NAME mysql -u root -p"
echo "  Then run: CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo ""
echo "Option 2: Non-interactive (if you know the password):"
echo "  docker exec -i $CONTAINER_NAME mysql -u root -p<password> -e \"CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
echo ""
echo "Option 3: Check if database already exists:"
echo "  docker exec -it $CONTAINER_NAME mysql -u root -p -e \"SHOW DATABASES;\""


