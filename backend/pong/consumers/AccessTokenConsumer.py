from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime, timedelta

class AccessTokenConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		await self.accept()

	async def disconnect(self, close_code):
		pass

	async def receive(self, text_data):
		refresh = await self.check_token()
		if refresh == True:
			await self.send("Refresh")

	async def check_token(self):
		from rest_framework_simplejwt.tokens import AccessToken
		try:
			cookies = self.scope["cookies"]
			token = AccessToken(cookies["access_token"])
			expiration = datetime.fromtimestamp(token["exp"])
			if (expiration - datetime.now()) <= timedelta(minutes=1):
				return True
		except Exception as e:
			return True
		return False
