"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from . import views

# Build urlpatterns in the CORRECT order
# CRITICAL: Order matters! Django checks patterns in order and stops at first match
urlpatterns = []

# 1. Static file routes (specific patterns - won't match /api/ paths)
from django.views.static import serve as static_serve
from django.http import FileResponse, HttpResponse
from pathlib import Path

def serve_favicon(request):
    """Serve favicon.ico from static/build or staticfiles."""
    favicon_paths = [
        settings.BASE_DIR / 'static/build/favicon.ico',
        settings.BASE_DIR / 'staticfiles/favicon.ico',
        settings.BASE_DIR / 'frontend/public/favicon.ico',
    ]
    
    for favicon_path in favicon_paths:
        if favicon_path.exists():
            try:
                return FileResponse(
                    open(favicon_path, 'rb'),
                    content_type='image/x-icon',
                    headers={'Cache-Control': 'public, max-age=31536000'}
                )
            except Exception:
                continue
    
    # Return 204 No Content if favicon not found (prevents 404 errors in browser console)
    return HttpResponse(status=204)

# Favicon route - must be before catch-all, works in both DEBUG and production
urlpatterns.append(re_path(r'^favicon\.ico$', serve_favicon, name='favicon'))

if settings.DEBUG:
    urlpatterns.extend([
        re_path(r'^assets/(?P<path>.*)$', static_serve, {
            'document_root': settings.BASE_DIR / 'static/build/assets'
        }),
        re_path(r'^logo-dark-full\.png$', static_serve, {
            'document_root': settings.BASE_DIR / 'static/build',
            'path': 'logo-dark-full.png'
        }),
    ])
    # Add static files (this adds /static/ routes)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # Add media files (this adds /media/ routes)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# 2. Admin routes (MUST come before catch-all)
urlpatterns.append(path('admin/', admin.site.urls))

# 3. API routes (MUST come before catch-all - THIS IS CRITICAL!)
# This MUST be checked before the catch-all regex
urlpatterns.append(path('api/', include('api.urls')))

# 4. Catch-all: serve React app (MUST come LAST!)
# This regex should NOT match /api/ paths because API route above should match first
# But we exclude it anyway as a safety measure
# CRITICAL: Django paths start with /, so check for /api/, not api/
# Also exclude /ws/ paths for WebSocket connections
urlpatterns.append(
    re_path(r'^(?!/api/|/admin/|/static/|/media/|/assets/|/favicon\.ico|/logo-|/ws/).*$', views.serve_react_app)
)

# DEBUG: Print URL pattern order on startup (only in DEBUG mode)
if settings.DEBUG:
    print("=" * 60)
    print("URL Pattern Order (Django checks in this order):")
    for i, pattern in enumerate(urlpatterns, 1):
        pattern_str = str(pattern.pattern) if hasattr(pattern, 'pattern') else str(pattern)
        print(f"  {i}. {pattern_str}")
    print("=" * 60)
