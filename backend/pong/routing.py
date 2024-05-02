from django.urls import path
from .consumers import *

websocket_urlpatterns = [
	path("ws/accesstoken", AccessTokenConsumer.as_asgi()),
	path("ws/getfollowed", GetFollowedConsumer.as_asgi()),
	path("ws/pongonline", PongOnlineConsumer.as_asgi())
]
