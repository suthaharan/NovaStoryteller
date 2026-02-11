"""
WebSocket URL routing for API app.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Match /ws/stories/{story_id}/voice/
    re_path(r'^ws/stories/(?P<story_id>[^/]+)/voice/$', consumers.VoiceStoryConsumer.as_asgi()),
]

