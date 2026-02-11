# WebSocket Setup for Voice Feature

## Issue

Django's `runserver` command uses WSGI and **does not support WebSocket connections**. WebSocket connections require an ASGI server.

## Solution: Use Daphne (ASGI Server)

### Installation

```bash
cd /Users/kurinchi/valet/novastoryteller
source venv/bin/activate
pip install daphne
```

### Running with Daphne

Instead of:
```bash
python manage.py runserver
```

Use:
```bash
daphne -b 0.0.0.0 -p 8000 backend.asgi:application
```

Or for localhost only:
```bash
daphne -b 127.0.0.1 -p 8000 backend.asgi:application
```

### Benefits

- ✅ Supports both HTTP and WebSocket connections
- ✅ Handles the Interactive Voice Storytelling feature
- ✅ Works with Django Channels
- ✅ Production-ready ASGI server

---

## Alternative: Development Script

Create a script to run Daphne easily:

```bash
#!/bin/bash
# scripts/run_server.sh
cd "$(dirname "$0")/.."
source venv/bin/activate
daphne -b 127.0.0.1 -p 8000 backend.asgi:application
```

Make it executable:
```bash
chmod +x scripts/run_server.sh
```

Then run:
```bash
./scripts/run_server.sh
```

---

## Verification

After starting with Daphne, you should see:

```
2026-02-11 01:30:00 Starting server at tcp:port=8000:interface=127.0.0.1
2026-02-11 01:30:00 HTTP/2 support not enabled (install the http2 and tls Twisted extras)
2026-02-11 01:30:00 Configuring endpoint tcp:port=8000:interface=127.0.0.1
2026-02-11 01:30:00 Listening on TCP address 127.0.0.1:8000
```

When you try to connect via WebSocket, you should see connection logs instead of the catch-all route error.

---

## Troubleshooting

### Error: `daphne: command not found`

**Solution**: Install daphne:
```bash
pip install daphne
```

### Error: WebSocket still not connecting

**Check**:
1. Daphne is running (not runserver)
2. WebSocket URL is correct: `ws://localhost:8000/ws/stories/{story-id}/voice/`
3. Browser console for connection errors
4. Daphne logs for WebSocket connection attempts

### Error: `ModuleNotFoundError: No module named 'channels'`

**Solution**: Install channels:
```bash
pip install channels
```

---

## Production Deployment

For production, use:
- **Daphne** (recommended) - ASGI server
- **Gunicorn + Uvicorn workers** - Alternative ASGI setup
- **Nginx** - Reverse proxy for static files and load balancing

Example production command:
```bash
daphne -b 0.0.0.0 -p 8000 --access-log - --proxy-headers backend.asgi:application
```

---

## Quick Reference

| Server | Type | WebSocket Support | Command |
|--------|------|-------------------|---------|
| `runserver` | WSGI | ❌ No | `python manage.py runserver` |
| `daphne` | ASGI | ✅ Yes | `daphne -b 127.0.0.1 -p 8000 backend.asgi:application` |

**For the Voice Feature, always use Daphne!**

