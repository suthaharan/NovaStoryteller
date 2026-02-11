#!/usr/bin/env python
"""Check if channels is properly installed and importable."""
import sys

print("=" * 60)
print("Channels Installation Check")
print("=" * 60)
print(f"Python executable: {sys.executable}")
print(f"Python version: {sys.version}")
print()

# Check if channels can be imported
try:
    import channels
    print("✅ channels module found")
    print(f"   Location: {channels.__file__}")
    print(f"   Version: {getattr(channels, '__version__', 'unknown')}")
except ImportError as e:
    print(f"❌ channels module NOT found: {e}")
    print()
    print("To fix:")
    print("1. Activate your virtual environment:")
    print("   source venv/bin/activate")
    print("2. Install channels:")
    print("   pip install channels")
    print("3. Verify installation:")
    print("   python scripts/check_channels.py")
    sys.exit(1)

# Check if channels submodules can be imported
try:
    from channels.routing import ProtocolTypeRouter
    print("✅ channels.routing imported successfully")
except ImportError as e:
    print(f"❌ channels.routing import failed: {e}")

try:
    from channels.auth import AuthMiddlewareStack
    print("✅ channels.auth imported successfully")
except ImportError as e:
    print(f"❌ channels.auth import failed: {e}")

try:
    from channels.generic.websocket import AsyncWebsocketConsumer
    print("✅ channels.generic.websocket imported successfully")
except ImportError as e:
    print(f"❌ channels.generic.websocket import failed: {e}")

print()
print("=" * 60)
print("If all checks pass, channels is properly installed!")
print("=" * 60)

