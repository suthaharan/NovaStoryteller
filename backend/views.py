"""
Views for serving React app.
"""
from django.http import HttpResponse
from django.conf import settings
from pathlib import Path


def serve_react_app(request):
    """
    Serve the React app's index.html file.
    This ensures the React build's index.html is served with correct asset paths.
    
    WARNING: This should NOT match /api/ paths. If you see this for API requests,
    the catch-all regex is incorrectly matching API routes.
    """
    # CRITICAL DEBUG: Log ALL requests to this view
    # Use sys.stdout.write to ensure it appears immediately
    import sys
    sys.stdout.write(f"\n🔴 serve_react_app called for: {request.method} {request.path}\n")
    sys.stdout.write(f"   Full path: {request.get_full_path()}\n")
    sys.stdout.flush()
    
    # Debug: Log if this is being called for API or WebSocket requests (shouldn't happen)
    if request.path.startswith('/api/'):
        sys.stdout.write(f"\n⚠️  ERROR: serve_react_app called for API path: {request.path}\n")
        sys.stdout.write(f"   This should NOT happen! API routes should be handled before catch-all.\n")
        sys.stdout.write(f"   This means the catch-all regex is incorrectly matching API routes!\n")
        sys.stdout.flush()
        return HttpResponse(
            f'<html><body><h1>Error: API route caught by catch-all</h1><p>Path: {request.path}</p><p>This is a configuration error.</p><p>Check backend/urls.py - API routes must come before catch-all.</p></body></html>',
            status=500
        )
    
    # WebSocket connections should go through ASGI, not WSGI
    if request.path.startswith('/ws/'):
        sys.stdout.write(f"\n⚠️  ERROR: serve_react_app called for WebSocket path: {request.path}\n")
        sys.stdout.write(f"   WebSocket connections require ASGI server (Daphne), not WSGI (runserver).\n")
        sys.stdout.write(f"   Please use: daphne -b 0.0.0.0 -p 8000 backend.asgi:application\n")
        sys.stdout.flush()
        return HttpResponse(
            f'<html><body><h1>WebSocket Error</h1><p>WebSocket connections require ASGI server.</p><p>Please use: <code>daphne -b 0.0.0.0 -p 8000 backend.asgi:application</code></p><p>Or install Daphne: <code>pip install daphne</code></p></body></html>',
            status=426  # Upgrade Required
        )
    
    react_index_path = settings.BASE_DIR / 'static/build/index.html'
    
    if react_index_path.exists():
        with open(react_index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return HttpResponse(content, content_type='text/html')
    else:
        return HttpResponse(
            '<html><body><h1>React build not found</h1><p>Please run: ./scripts/build_frontend.sh</p></body></html>',
            status=404
        )

