# Frontend Build and Deployment Guide

This guide explains how to build the React frontend and publish changes to the application.

## Overview

The application uses a **monolithic architecture** where Django serves both the API and the React frontend. The build process:

1. Builds the React app using Vite (outputs to `frontend/dist/`)
2. Copies the build files to `static/build/` (Django static directory)
3. Collects static files using Django's `collectstatic` command
4. Django serves the React app for all non-API routes

## Quick Build Steps

### Option 1: Using the Build Script (Recommended)

```bash
# From project root directory
./scripts/build_frontend.sh
```

This script will:
- Install npm dependencies (if needed)
- Build the React app with Vite
- Copy build files to `static/build/`
- Display next steps

After running the script, complete the process:

```bash
# Collect static files (includes React build)
python manage.py collectstatic --noinput

# Start Django server
python manage.py runserver
```

### Option 2: Manual Build Process

If you prefer to build manually or need more control:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if needed)
npm install

# 3. Build the React app
npm run build

# 4. Return to project root
cd ..

# 5. Create static/build directory (if it doesn't exist)
mkdir -p static/build

# 6. Copy build files to Django static directory
rm -rf static/build/*  # Remove old files
cp -r frontend/dist/* static/build/

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Start Django server
python manage.py runserver
```

## Build Process Details

### Step-by-Step Explanation

1. **Build React App** (`npm run build`)
   - Vite compiles React components
   - Bundles JavaScript, CSS, and assets
   - Outputs optimized production files to `frontend/dist/`
   - Generates `index.html` and asset files with hashed names

2. **Copy to Static Directory**
   - Files are copied from `frontend/dist/` to `static/build/`
   - Django's `STATICFILES_DIRS` includes `static/build/`
   - This allows Django to serve the React app

3. **Collect Static Files** (`collectstatic`)
   - Django collects all static files (including React build)
   - Copies them to `staticfiles/` directory
   - Uses WhiteNoise for serving static files in production
   - Creates optimized, compressed versions

4. **Django Serves React App**
   - All routes except `/api/*` are served by Django
   - Django's catch-all route serves `static/build/index.html`
   - React Router handles client-side routing

## Development vs Production Builds

### Development Mode

For development, you can run React and Django separately:

```bash
# Terminal 1: Django backend
python manage.py runserver

# Terminal 2: React dev server (with hot reload)
cd frontend
npm run dev
```

The React dev server runs on a different port (usually `:5173`) and proxies API calls to Django.

### Production Build

For production, always use the build process:

```bash
./scripts/build_frontend.sh
python manage.py collectstatic --noinput
python manage.py runserver
```

## Verifying the Build

After building, verify the build was successful:

1. **Check build output exists:**
   ```bash
   ls -la static/build/
   ```
   Should contain: `index.html`, `assets/`, `favicon.ico`, etc.

2. **Check static files collected:**
   ```bash
   ls -la staticfiles/
   ```
   Should contain React build files in `staticfiles/assets/`

3. **Test the application:**
   ```bash
   python manage.py runserver
   ```
   Visit `http://localhost:8000` - should see the React app

## Troubleshooting

### Build Fails

**Error: `npm: command not found`**
- Install Node.js and npm
- Verify: `node --version` and `npm --version`

**Error: `Cannot find module`**
- Run `cd frontend && npm install`
- Check `package.json` for missing dependencies

**Error: Build output not found**
- Check `frontend/dist/` exists after build
- Verify build completed without errors
- Check Vite configuration in `vite.config.js`

### Static Files Not Loading

**404 errors for CSS/JS files**
- Run `python manage.py collectstatic --noinput`
- Check `STATICFILES_DIRS` in `backend/settings.py`
- Verify `static/build/` contains files

**React app shows blank page**
- Check browser console for errors
- Verify `index.html` exists in `static/build/`
- Check Django URL routing in `backend/urls.py`

### Caching Issues

**Old version still showing after build**
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Run `python manage.py collectstatic --noinput --clear`
- Check file timestamps in `static/build/`

## Production Deployment

For production deployment:

1. **Build the frontend:**
   ```bash
   ./scripts/build_frontend.sh
   ```

2. **Set environment variables:**
   - `DEBUG=False`
   - `ALLOWED_HOSTS` configured
   - Database credentials set

3. **Collect static files:**
   ```bash
   python manage.py collectstatic --noinput
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Start the server:**
   - Use a production WSGI server (Gunicorn, uWSGI)
   - Configure reverse proxy (Nginx, Apache)
   - Set up SSL certificates

## Automated Build Script

The `scripts/build_frontend.sh` script automates the build process. You can enhance it for CI/CD:

```bash
#!/bin/bash
set -e

cd frontend
npm ci  # Clean install (faster, removes node_modules)
npm run build
cd ..

mkdir -p static/build
rm -rf static/build/*
cp -r frontend/dist/* static/build/

echo "✅ Frontend build complete!"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build Frontend

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      
      - name: Copy to static
        run: |
          mkdir -p static/build
          cp -r frontend/dist/* static/build/
      
      - name: Deploy
        # Add your deployment steps here
```

## Best Practices

1. **Always build before deploying** - Never deploy without running the build script
2. **Test the build locally** - Verify the build works before pushing to production
3. **Version control** - Don't commit `static/build/` or `staticfiles/` (add to `.gitignore`)
4. **Clear cache** - Use `--clear` flag with `collectstatic` if you see stale files
5. **Environment variables** - Ensure API URLs are correct for production

## File Structure After Build

```
novastoryteller/
├── frontend/
│   ├── dist/              # Vite build output (not committed)
│   │   ├── index.html
│   │   ├── assets/
│   │   └── favicon.ico
│   └── ...
├── static/
│   └── build/             # Copied from frontend/dist/ (not committed)
│       ├── index.html
│       ├── assets/
│       └── favicon.ico
└── staticfiles/           # Collected static files (not committed)
    ├── assets/
    ├── admin/
    └── ...
```

## Additional Resources

- [Vite Build Documentation](https://vitejs.dev/guide/build.html)
- [Django Static Files](https://docs.djangoproject.com/en/stable/howto/static-files/)
- [WhiteNoise Documentation](https://whitenoise.readthedocs.io/)

