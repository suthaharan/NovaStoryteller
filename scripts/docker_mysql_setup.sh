#!/bin/bash
# Script to help set up MySQL in Docker and test connection

echo "=== Docker MySQL Setup Helper ==="
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "✗ Docker is not running. Please start Docker first."
    exit 1
fi

echo "1. Checking for MySQL containers..."
docker ps -a | grep -i mysql || echo "   No MySQL containers found"

echo ""
echo "2. To connect to MySQL in Docker, you have a few options:"
echo ""
echo "   Option A: If MySQL is exposed on localhost:5506"
echo "   - Your .env should have:"
echo "     DB_HOST=localhost"
echo "     DB_PORT=5506"
echo ""
echo "   Option B: If using Docker network"
echo "   - Find your container name: docker ps"
echo "   - Use container name as host: DB_HOST=container_name"
echo "   - Or use Docker network IP"
echo ""
echo "3. To create the database in Docker MySQL:"
echo "   docker exec -it <container_name> mysql -u root -p"
echo "   Then run: CREATE DATABASE sensitive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo ""
echo "4. Test connection from host:"
echo "   mysql -h localhost -P 5506 -u root -p"
echo ""

# Try to find MySQL container
MYSQL_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i mysql | head -n 1)

if [ -n "$MYSQL_CONTAINER" ]; then
    echo "Found MySQL container: $MYSQL_CONTAINER"
    echo ""
    echo "Container details:"
    docker ps --filter "name=$MYSQL_CONTAINER" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
    echo ""
    echo "To access MySQL in this container:"
    echo "  docker exec -it $MYSQL_CONTAINER mysql -u root -p"
else
    echo "No running MySQL container found."
    echo ""
    echo "To start a MySQL container with port 5506:"
    echo "  docker run -d --name mysql-sensitive \\"
    echo "    -e MYSQL_ROOT_PASSWORD=password \\"
    echo "    -p 5506:3306 \\"
    echo "    mysql:8.0"
fi


