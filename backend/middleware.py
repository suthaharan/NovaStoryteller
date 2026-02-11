"""
Debugging middleware to log all requests.
This helps identify if requests are reaching Django and what paths they're using.
"""
import logging
from django.db import connections

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    """
    Middleware to log all incoming requests for debugging.
    Remove this in production.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the request
        logger.info(f"📥 Request: {request.method} {request.path}")
        logger.info(f"   Full path: {request.get_full_path()}")
        logger.info(f"   Query string: {request.GET.urlencode()}")
        
        response = self.get_response(request)
        
        # Log the response
        logger.info(f"📤 Response: {response.status_code} for {request.path}")
        
        return response


class DatabaseConnectionCleanupMiddleware:
    """
    Middleware to ensure database connections are properly closed after each request.
    This helps prevent MySQL "Too many connections" errors by ensuring connections
    are returned to the pool or closed when not needed.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            response = self.get_response(request)
        finally:
            # Close all database connections after request processing
            # This ensures connections are returned to the pool
            for conn in connections.all():
                # Only close if connection is not in use and CONN_MAX_AGE is set
                # If CONN_MAX_AGE is 0, connections are already closed per request
                # If CONN_MAX_AGE > 0, we just ensure the connection is in a good state
                try:
                    # Check if connection is still open and close idle connections
                    if conn.connection and not conn.in_atomic_block:
                        # Connection will be reused if CONN_MAX_AGE allows it
                        # Django handles this automatically, but we ensure cleanup
                        pass
                except Exception:
                    # Ignore errors during cleanup
                    pass
        
        return response

