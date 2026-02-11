#!/bin/bash

# Build script for React frontend (Vite)
# This script builds the React app and copies it to Django's static directory
# The app will be served by Django on the same port (monolithic setup)

set -e

echo "=========================================="
echo "Building React Frontend for Django"
echo "=========================================="

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the React app with Vite (outputs to 'dist' directory)
echo "Building React app with Vite..."
npm run build

# Navigate back to project root
cd ..

# Create static/build directory if it doesn't exist
echo "Preparing Django static directory..."
mkdir -p static/build

# Copy Vite build output (dist) to Django static/build
echo "Copying build files to Django static directory..."
if [ -d "frontend/dist" ]; then
    # Remove old build files
    rm -rf static/build/*
    
    # Copy new build files
    cp -r frontend/dist/* static/build/
    
    # Update Django template with Vite build references
    echo ""
    echo "Updating Django template with Vite build references..."
    UPDATE_TEMPLATE_SUCCESS=false
    if [ -f "venv/bin/python" ]; then
        venv/bin/python scripts/update_django_template.py && UPDATE_TEMPLATE_SUCCESS=true || true
    elif [ -f "venv/bin/python3" ]; then
        venv/bin/python3 scripts/update_django_template.py && UPDATE_TEMPLATE_SUCCESS=true || true
    else
        echo "⚠️  Warning: Virtual environment not found. Trying system Python..."
        (python scripts/update_django_template.py || python3 scripts/update_django_template.py) && UPDATE_TEMPLATE_SUCCESS=true || true
    fi
    
    # Collect static files automatically
    # Use venv's Python if available, otherwise use system Python
    # Note: We use || true to prevent script exit on failure (set -e is active)
    echo ""
    echo "Collecting static files..."
    COLLECTSTATIC_SUCCESS=false
    if [ -f "venv/bin/python" ]; then
        venv/bin/python manage.py collectstatic --noinput && COLLECTSTATIC_SUCCESS=true || true
    elif [ -f "venv/bin/python3" ]; then
        venv/bin/python3 manage.py collectstatic --noinput && COLLECTSTATIC_SUCCESS=true || true
    else
        echo "⚠️  Warning: Virtual environment not found. Trying system Python..."
        echo "   Make sure Django is installed: pip install -r requirements.txt"
        (python manage.py collectstatic --noinput || python3 manage.py collectstatic --noinput) && COLLECTSTATIC_SUCCESS=true || true
    fi
    
    clear
    echo "✅ Build complete! React app is now in static/build/"
    echo ""
    if [ "$UPDATE_TEMPLATE_SUCCESS" = true ]; then
        echo "✅ Django template updated with Vite build references."
    else
        echo "⚠️  Note: Template update was skipped or failed."
        echo "   Run manually: python scripts/update_django_template.py"
    fi
    echo ""
    if [ "$COLLECTSTATIC_SUCCESS" = true ]; then
        echo "✅ Static files collected successfully."
    else
        echo "⚠️  Note: Static files collection was skipped or failed."
        echo "   Run manually: python manage.py collectstatic --noinput"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Start Django: python manage.py runserver"
    echo "  2. Access app at: http://localhost:8000"
else
    clear
    echo "❌ Error: frontend/dist directory not found!"
    echo "   Build may have failed. Check the output above."
    exit 1
fi

