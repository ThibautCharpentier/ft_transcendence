from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import base64
import json

class GetFollowedConsumer(AsyncWebsocketConsumer):
	async def connect(self):
		from pong.models.user import User
		from rest_framework_simplejwt.authentication import JWTAuthentication
		try:
			cookies = self.scope["cookies"]
			token = JWTAuthentication().get_validated_token(cookies["access_token"])
			user_id = token.payload.get('user_id')
			self.user = await sync_to_async(User.objects.get)(id=user_id)
		except Exception as e:
			await self.close()
			return
		if self.user != None:
			await self.accept()
		else:
			await self.close()
			return
		if self.user.status == User.Status.OFFLINE:
			self.user.status = User.Status.ONLINE
			await sync_to_async(self.user.save)()
		await self.first_check_follows()
		await self.first_check_requests()
	
	async def disconnect(self, close_code):
		from pong.models.user import User
		if hasattr(self, 'user') and self.user != None:
			try:
				self.user = await sync_to_async(User.objects.get)(id=self.user.id)
			except Exception as e:
				return
			if self.user.status != User.Status.OFFLINE:
				self.user.status = User.Status.OFFLINE
				await sync_to_async(self.user.save)()

	async def receive(self, text_data):
		from pong.models.user import User
		try:
			self.user = await sync_to_async(User.objects.get)(id=self.user.id)
		except Exception as e:
			await self.close()
			return
		self.tab_data = []
		await self.check_follows()
		await self.check_requests()
		await self.send(text_data=json.dumps(self.tab_data))
	
	async def check_follows(self):
		from pong.models.user import User
		follows = []
		if self.user.followed:
			follows = self.user.followed.split(',')
		int_follows = []
		for char in follows:
			if char:
				int_follows.append(int(char))
		tab_follows = await sync_to_async(User.objects.filter)(id__in=int_follows)
		new_follows_data = []
		async for follow in tab_follows:
			if follow.avatar:
				try:
					with open(follow.avatar.path, "rb") as image_file:
						encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				except Exception as e:
					encoded_image = None
			else:
				encoded_image = None
			new_follows_data.append({
				'id': follow.id,
				'username': follow.username,
				'status': follow.status,
				'avatar': encoded_image,
			})
		if self.follows_data != new_follows_data:
			remove_follows = []
			for i in range(0, len(self.follows_data)):
				check = False
				for j in range(0, len(new_follows_data)):
					if self.follows_data[i]['id'] == new_follows_data[j]['id']:
						check = True
				if check == False:
					remove_follows.append({
						'id': self.follows_data[i]['id'],
					})
			if remove_follows != []:
				self.tab_data.append(remove_follows)
			else:
				self.tab_data.append(None)
			news_data_follow = []
			for i in range(0, len(self.follows_data)):
				for j in range(0, len(new_follows_data)):
					if self.follows_data[i]['id'] == new_follows_data[j]['id'] and self.follows_data[i] != new_follows_data[j]:
						news_data_follow.append(new_follows_data[j])
						break
			if len(new_follows_data) > len(self.follows_data):
				for i in range(0, len(new_follows_data)):
					add = True
					for j in range(0, len(news_data_follow)):
						if news_data_follow[j]['id'] == new_follows_data[i]['id']:
							add = False
							break
					if add == True:
						news_data_follow.append(new_follows_data[i])
			self.follows_data = new_follows_data
			if news_data_follow != []:
				self.tab_data.append(news_data_follow)
			else:
				self.tab_data.append(None)
		else:
			self.tab_data.append(None)
			self.tab_data.append(None)

	async def check_requests(self):
		from pong.models.user import User
		requests = []
		if self.user.requestFollowed:
			requests = self.user.requestFollowed.split(',')
		int_requests = []
		for char in requests:
			if char:
				int_requests.append(int(char))
		tab_requests = await sync_to_async(User.objects.filter)(id__in=int_requests)
		new_requests_data = []
		async for request in tab_requests:
			if request.avatar:
				try:
					with open(request.avatar.path, "rb") as image_file:
						encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				except Exception as e:
					encoded_image = None
			else:
				encoded_image = None
			new_requests_data.append({
				'id': request.id,
				'username': request.username,
				'avatar': encoded_image,
			})
		if self.requests_data != new_requests_data:
			remove_requests = []
			for i in range(0, len(self.requests_data)):
				check = False
				for j in range(0, len(new_requests_data)):
					if self.requests_data[i]['id'] == new_requests_data[j]['id']:
						check = True
				if check == False:
					remove_requests.append({
						'id': self.requests_data[i]['id'],
					})
			if remove_requests != []:
				self.tab_data.append(remove_requests)
			else:
				self.tab_data.append(None)
			news_data_request = []
			for i in range(0, len(self.requests_data)):
				for j in range(0, len(new_requests_data)):
					if self.requests_data[i]['id'] == new_requests_data[j]['id'] and self.requests_data[i] != new_requests_data[j]:
						news_data_request.append(new_requests_data[j])
						break
			if len(new_requests_data) > len(self.requests_data):
				for i in range(0, len(new_requests_data)):
					add = True
					for j in range(0, len(news_data_request)):
						if news_data_request[j]['id'] == new_requests_data[i]['id']:
							add = False
							break
					if add == True:
						news_data_request.append(new_requests_data[i])
			self.requests_data = new_requests_data
			if news_data_request != []:
				self.tab_data.append(news_data_request)
			else:
				self.tab_data.append(None)
		else:
			self.tab_data.append(None)
			self.tab_data.append(None)

	async def first_check_follows(self):
		from pong.models.user import User
		follows = []
		if self.user.followed:
			follows = self.user.followed.split(',')
		int_follows = []
		for char in follows:
			if char:
				int_follows.append(int(char))
		tab_follows = await sync_to_async(User.objects.filter)(id__in=int_follows)
		self.follows_data = []
		async for follow in tab_follows:
			if follow.avatar:
				try:
					with open(follow.avatar.path, "rb") as image_file:
						encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				except Exception as e:
					encoded_image = None
			else:
				encoded_image = None
			self.follows_data.append({
				'id': follow.id,
				'username': follow.username,
				'status': follow.status,
				'avatar': encoded_image,
			})

	async def first_check_requests(self):
		from pong.models.user import User
		requests = []
		if self.user.requestFollowed:
			requests = self.user.requestFollowed.split(',')
		int_requests = []
		for char in requests:
			if char:
				int_requests.append(int(char))
		tab_requests = await sync_to_async(User.objects.filter)(id__in=int_requests)
		self.requests_data = []
		async for request in tab_requests:
			if request.avatar:
				try:
					with open(request.avatar.path, "rb") as image_file:
						encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				except Exception as e:
					encoded_image = None
			else:
				encoded_image = None
			self.requests_data.append({
				'id': request.id,
				'username': request.username,
				'avatar': encoded_image,
			})
