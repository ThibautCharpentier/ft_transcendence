from queue import Queue
from channels.generic.websocket import AsyncWebsocketConsumer
import uuid
import json
import random
import math
import asyncio
from asgiref.sync import sync_to_async
import time
import math

matchmaking = Queue()

grid_width = 1920
grid_height = 1080
score_max = 7

ball_size = 40
ball_initial_speed = 1
ball_max_speed = 2.49
ball_acc = 0.05
ball_radius = ball_size / 2
ball_X_start = grid_width / 2
ball_Y_start = grid_height / 2
bounce_angle_max = 75 * (math.pi / 180)

paddle_width = 40
paddle_height = 200
paddle_speed = 1
paddle_margin = 80
paddle_width_range = paddle_width / 2
paddle_height_range = paddle_height / 2
paddle1_X_start = paddle_width_range + paddle_margin
paddle1_Y_start = grid_height / 2
paddle2_X_start = grid_width - paddle_width_range - paddle_margin
paddle2_Y_start = grid_height / 2

async def check_matchmaking():
	if matchmaking.qsize() >= 2:
		player_1 = matchmaking.get()
		player_2 = matchmaking.get()
		if player_1.user_id == player_2.user_id:
			matchmaking.put(player_1)
			player_2.player_number = 3
			await player_2.send(text_data=json.dumps({
				'message': "already in queue"
			}))
			await player_2.close()
			return
		game_id = uuid.uuid4().hex
		player_1.game_id = game_id
		player_2.game_id = game_id
		player_1.player_number = 1
		player_2.player_number = 2
		player_1.opponent_number = 2
		player_2.opponent_number = 1
		player_1.opponent_id = player_2.user_id
		player_2.opponent_id = player_1.user_id
		await player_1.channel_layer.group_add(
			player_1.game_id,
			player_1.channel_name
		)
		await player_2.channel_layer.group_add(
			player_2.game_id,
			player_2.channel_name
		)
		random.seed()
		if random.randint(0, 1) == 1:
			ball_initial_angle = 0
		else:
			ball_initial_angle = 180 * (math.pi / 180)
		await player_1.initiate_items(ball_initial_angle)
		await player_2.initiate_items(ball_initial_angle)
		await player_1.channel_layer.group_send(
			player_1.game_id,
			{
				'type': 'match_found',
				'message': 'match found',
				'id_1': player_1.user_id,
				'id_2': player_2.user_id,
				'player_1': player_1.username,
				'player_2': player_2.username,
				'ball_initial_angle': ball_initial_angle
			}
        )
		player_1.thread = asyncio.create_task(player_1.game_update())
		player_2.thread = asyncio.create_task(player_2.game_update())

async def addMatch(winner, looser, looserScore):
	from pong.models import User
	from pong.models import MatchHistory
	user = []
	try:
		user.append(await sync_to_async(User.objects.get)(id=winner))
		user.append(await sync_to_async(User.objects.get)(id=looser))
	except Exception as e:
		print(str(e))
	match = await sync_to_async(MatchHistory.objects.create)(
		winner=user[0].id,
		looser=user[1].id,
		looserScore=looserScore,
		matchType='online'
	)
	await sync_to_async(match.save)()
	user[0].games += 1
	user[0].victory += 1
	user[0].winStreak += 1
	if user[0].winStreak > user[0].biggestWinStreak:
		user[0].biggestWinStreak = user[0].winStreak
	await sync_to_async(user[0].save)()
	user[1].games += 1
	user[1].winStreak = 0
	await sync_to_async(user[1].save)()

class PongOnlineConsumer(AsyncWebsocketConsumer):
	async def initiate_items(self, ball_initial_angle):
		self.ball_angle = ball_initial_angle
		self.ball_x = ball_X_start
		self.ball_y = ball_Y_start
		self.ball_z = 0
		self.ball_speed = ball_initial_speed
		self.ball_engage = True
		self.ball_time_start = 0
		self.ball_collision_x = 0
		self.ball_collision_y = 0
		self.coef = 0

		self.countdown_status = 0
		self.begin = False
		self.finish = False
		self.no_adv = False
		self.last_time = time.time() * 1000
		self.last_time_receive = time.time() * 1000
		self.in_game = True

		self.p1_score = 0
		self.p2_score = 0

		if self.player_number == 1:
			self.paddle_x = paddle1_X_start
			self.paddle_y = paddle1_Y_start
		else:
			self.paddle_x = paddle2_X_start
			self.paddle_y = paddle2_Y_start
	
	async def paddle_collision(self, paddle_x, paddle_y, me):
		if (self.ball_x != self.ball_last_x
		and (self.ball_x + ball_radius >= paddle_x - paddle_width_range and paddle_x + paddle_width_range > self.ball_last_x - ball_radius
		or self.ball_x - ball_radius <= paddle_x + paddle_width_range and paddle_x - paddle_width_range < self.ball_last_x + ball_radius)
		and (self.ball_y + ball_radius >= paddle_y - paddle_height_range and paddle_y + paddle_height_range > self.ball_last_y - ball_radius
		or self.ball_y - ball_radius <= paddle_y + paddle_height_range and paddle_y - paddle_height_range < self.ball_last_y + ball_radius)):
			self.coef = (self.ball_last_y - self.ball_y) / (self.ball_last_x - self.ball_x)
			if self.ball_x + ball_radius >= paddle_x - paddle_width_range and paddle_x - paddle_width_range > self.ball_last_x + ball_radius:
				self.ball_collision_x = paddle_x - paddle_width_range - ball_radius
				self.ball_collision_y = self.coef * (self.ball_collision_x - self.ball_x) + self.ball_y
			elif self.ball_x - ball_radius <= paddle_x + paddle_width_range and paddle_x + paddle_width_range < self.ball_last_x - ball_radius:
				self.ball_collision_x = paddle_x + paddle_width_range + ball_radius
				self.ball_collision_y = self.coef * (self.ball_collision_x - self.ball_x) + self.ball_y
			elif self.ball_y + ball_radius >= paddle_y - paddle_height_range and paddle_y - paddle_height_range > self.ball_last_y + ball_radius:
				self.ball_collision_y = paddle_y - paddle_height_range - ball_radius
				self.ball_collision_x = (self.ball_collision_y - self.ball_y) / self.coef + self.ball_x
			elif self.ball_y - ball_radius <= paddle_y + paddle_height_range and paddle_y + paddle_height_range < self.ball_last_y - ball_radius:
				self.ball_collision_y = paddle_y + paddle_height_range + ball_radius
				self.ball_collision_x = (self.ball_collision_y - self.ball_y) / self.coef + self.ball_x
			elif (self.ball_last_y - paddle_y) * (self.ball_last_y - self.ball_y) >= 0:
				self.ball_collision_y = self.ball_y
				self.ball_collision_x = self.ball_x
			else:
				return
			if self.ball_collision_x >= paddle_x:
				self.ball_angle = bounce_angle_max * (self.ball_collision_y - paddle_y) / (ball_radius + paddle_height_range)
			else:
				self.ball_angle = math.pi - bounce_angle_max * (self.ball_collision_y - paddle_y) / (ball_radius + paddle_height_range)
			if self.ball_engage == True:
				self.ball_engage = False
			if self.ball_speed < ball_max_speed:
				self.ball_speed += ball_acc
			await self.calcul_next_pos(True)
			if self.no_adv == False and me == True:
				await self.channel_layer.group_send(
					self.game_id,
					{
						'type': 'send_collision',
						'message': 'collision',
						'player': self.player_number,
						'ball_x': self.ball_x,
						'ball_y': self.ball_y,
						'ball_z': self.ball_z,
						'angle': self.ball_angle,
						'speed': self.ball_speed,
						'engage': self.ball_engage,
						'paddle_x': paddle_x,
						'paddle_y': paddle_y,
					}
				)
			elif self.no_adv == True and me == True:
				try:
					await self.send(text_data=json.dumps({
						'message': 'collision',
						'player': self.player_number,
						'ball_x': self.ball_x,
						'ball_y': self.ball_y,
						'ball_z': self.ball_z,
						'paddle_x': paddle_x,
						'paddle_y': paddle_y,
					}))
				except Exception as e:
					print(str(e))
			elif self.no_adv == True and me == False:
				try:
					await self.send(text_data=json.dumps({
						'message': 'collision',
						'player': self.opponent_number,
						'ball_x': self.ball_x,
						'ball_y': self.ball_y,
						'ball_z': self.ball_z,
						'paddle_adv_x': paddle_x,
						'paddle_adv_y': paddle_y,
					}))
				except Exception as e:
					print(str(e))

	async def score_increase(self, who_scoring):
		if who_scoring == 1:
			self.p1_score += 1
		else:
			self.p2_score += 1
		if self.p1_score < score_max and self.p2_score < score_max:
			asyncio.create_task(self.start_countdown())
		else:
			if self.p1_score >= score_max and self.player_number == 1:
				await addMatch(self.user_id, self.opponent_id, self.p2_score)
			elif self.p1_score >= score_max and self.player_number == 2:
				await addMatch(self.opponent_id, self.user_id, self.p2_score)
			elif self.p2_score >= score_max and self.player_number == 1:
				await addMatch(self.opponent_id, self.user_id, self.p1_score)
			elif self.p2_score >= score_max and self.player_number == 2:
				await addMatch(self.user_id, self.opponent_id, self.p1_score)
			asyncio.create_task(self.end_game())

	async def scoring(self, angle, who_scoring):
		if self.countdown_status == 0:
			self.ball_time_start = time.time() * 1000
			if (who_scoring != self.player_number or self.no_adv == True) and self.finish == False:
				await self.channel_layer.group_send(
					self.game_id,
					{
						'type': 'next_point',
						'message': 'scoring',
						'player': self.player_number,
						'scoring': who_scoring,
						'ball_x': self.ball_x,
						'ball_y': self.ball_y,
						'ball_z': self.ball_z,
						'angle': self.ball_angle,
						'paddle_x': self.paddle_x,
						'paddle_y': self.paddle_y,
					}
				)
				await self.score_increase(who_scoring)
				self.countdown_status = 1
		if self.countdown_status == 1:
			self.ball_dt = time.time() * 1000 - self.ball_time_start
			self.ball_z = - (self.ball_dt) * (self.ball_dt) / 1000
		if self.countdown_status == 2:
			self.ball_engage = True
			self.ball_x = ball_X_start
			self.ball_y = ball_Y_start
			self.ball_last_x = ball_X_start
			self.ball_last_y = ball_Y_start
			self.ball_z = 0
			self.ball_speed = ball_initial_speed
			self.ball_angle = angle
			self.countdown_status = 0

	async def wall_collision(self):
		while self.ball_y + ball_radius >= grid_height or self.ball_y - ball_radius <= 0:
			if self.ball_y + ball_radius >= grid_height:
				self.coef = (self.ball_last_x - self.ball_x) / (self.ball_last_y - self.ball_y)
				self.ball_collision_y = grid_height - ball_radius
				self.ball_collision_x = self.coef * (self.ball_collision_y - self.ball_y) + self.ball_x
				self.ball_angle = -math.acos(math.cos(self.ball_angle))
			if self.ball_y - ball_radius <= 0:
				self.coef = (self.ball_last_x - self.ball_x) / (self.ball_last_y - self.ball_y)
				self.ball_collision_y = ball_radius
				self.ball_collision_x = self.coef * (self.ball_collision_y - self.ball_y) + self.ball_x
				self.ball_angle = math.acos(math.cos(self.ball_angle))
			await self.calcul_next_pos(True)
		if self.ball_x + ball_radius >= grid_width:
			await self.scoring(0, 1)
		if self.ball_x - ball_radius <= 0:
			await self.scoring(180 * math.pi / 180, 2)

	async def calcul_next_pos(self, collision):
		if collision == True:
			self.ball_last_x = self.ball_collision_x
			self.ball_last_y = self.ball_collision_y
			dist = math.sqrt((self.ball_collision_x - self.ball_x) * (self.ball_collision_x - self.ball_x) + (self.ball_collision_y - self.ball_y) * (self.ball_collision_y - self.ball_y))
			self.ball_x = self.ball_collision_x + math.cos(self.ball_angle) * dist
			self.ball_y = self.ball_collision_y + math.sin(self.ball_angle) * dist
		else:
			if self.ball_engage == True:
				self.ball_x += math.cos(self.ball_angle) * self.ball_speed * self.dt / 2
				self.ball_y += math.sin(self.ball_angle) * self.ball_speed * self.dt / 2
			else:
				self.ball_x += math.cos(self.ball_angle) * self.ball_speed * self.dt
				self.ball_y += math.sin(self.ball_angle) * self.ball_speed * self.dt

	async def update_ball(self):
		self.ball_last_x = self.ball_x
		self.ball_last_y = self.ball_y
		await self.calcul_next_pos(False)
		await self.paddle_collision(self.paddle_x, self.paddle_y, True)
		if self.no_adv == True:
			await self.paddle_collision(self.paddle_adv_x, self.paddle_adv_y, False)
		await self.wall_collision()

	async def end_game(self):
		self.countdown_status = 1
		await asyncio.sleep(2)
		await self.send(text_data=json.dumps({
			'message': 'finish',
		}))
		self.finish = True

	async def start_countdown(self):
		self.countdown_status = 1
		if self.finish == False:
			i = 3
			while i >= 0:
				await asyncio.sleep(1)
				try:
					await self.send(text_data=json.dumps({
						'message': 'countdown',
						'count': i,
					}))
					i -= 1
				except Exception as e:
					print(str(e))
			if self.begin == False:
				self.countdown_status = 0
			else:
				self.countdown_status = 2
			self.begin = True

	async def check_token(self):
		from rest_framework_simplejwt.authentication import JWTAuthentication
		from pong.models import User
		try:
			cookies = self.scope["cookies"]
			token = JWTAuthentication().get_validated_token(cookies["access_token"])
			self.user_id = token.payload.get('user_id')
			user = await sync_to_async(User.objects.get)(id=self.user_id)
			self.username = user.username
		except Exception as e:
			print(str(e))
			return False
		return True

	async def connect(self):
		connected = await self.check_token()
		if connected == False:
			return
		matchmaking.put(self)
		await self.accept()
		await check_matchmaking()
	
	async def disconnect(self, close_code):
		if self in matchmaking.queue:
			matchmaking.queue.remove(self)
			return
		elif self.player_number != 3 and self.in_game == True:
			await self.channel_layer.group_send(
				self.game_id,
				{
					'type': 'quit_game',
					'message': "quit",
					'paddle_x': self.paddle_x,
					'paddle_y': self.paddle_y,
					'player': self.player_number
				}
        	)
			await self.channel_layer.group_discard(
				self.game_id,
				self.channel_name
			)
		if self.player_number != 3:
			try:
				self.thread.cancel()
			except Exception as e:
				print(str(e))

	async def quit_game(self, event):
		try:
			if self.player_number != event["player"]:
				self.no_adv = True
				self.paddle_adv_x = event["paddle_x"]
				self.paddle_adv_y = event["paddle_y"]
		except Exception as e:
			print(str(e))

	async def game_update(self):
		asyncio.create_task(self.start_countdown())
		while self.finish == False:
			self.time = time.time() * 1000
			self.dt = self.time - self.last_time
			self.last_time = self.time
			if self.no_adv == False:
				await self.channel_layer.group_send(
					self.game_id,
					{
						'type': 'send_paddles',
						'message': 'check',
						'player': self.player_number,
						'paddle_x': self.paddle_x,
						'paddle_y': self.paddle_y,
					}
				)
			if self.begin == True:
				await self.update_ball()
			await asyncio.sleep(0.016)
		self.in_game = False
		await self.close()

	async def check_paddles(self, data):
		if data["up"] == True:
			self.paddle_y -= paddle_speed * self.dt_receive
		if data["down"] == True:
			self.paddle_y += paddle_speed * self.dt_receive
		if self.paddle_y < paddle_height_range:
			self.paddle_y = paddle_height_range
		if self.paddle_y > grid_height - paddle_height_range:
			self.paddle_y = grid_height - paddle_height_range

	async def receive(self, text_data):
		data = json.loads(text_data)
		if data["message"] == "check":
			self.time_receive = time.time() * 1000
			self.dt_receive = self.time_receive - self.last_time_receive
			self.last_time_receive = self.time_receive
			await self.check_paddles(data)
			try:
				await self.send(text_data=json.dumps({
						'message': 'update',
						'player': self.player_number,
						'ball_x': self.ball_x,
						'ball_y': self.ball_y,
						'ball_z': self.ball_z,
						'paddle_x': self.paddle_x,
						'paddle_y': self.paddle_y
				}))
			except Exception as e:
				print(str(e))

	async def next_point(self, event):
		try:
			if self.player_number != event["player"]:
				if event["scoring"] == 1:
					self.p1_score += 1
				else:
					self.p2_score += 1
				self.countdown_status = 1
				self.ball_angle = event["angle"]
				await self.send(text_data=json.dumps({
					'message': event["message"],
					'player': event["player"],
					'scoring': event["scoring"],
					'ball_x': event["ball_x"],
					'ball_y': event["ball_y"],
					'ball_z': event["ball_z"],
					'paddle_adv_x': event["paddle_x"],
					'paddle_adv_y': event["paddle_y"],
				}))
				if self.p1_score < score_max and self.p2_score < score_max:
					asyncio.create_task(self.start_countdown())
				else:
					asyncio.create_task(self.end_game())
			else:
				await self.send(text_data=json.dumps({
					'message': event["message"],
					'player': event["player"],
					'scoring': event["scoring"],
					'ball_x': event["ball_x"],
					'ball_y': event["ball_y"],
					'ball_z': event["ball_z"],
				}))
		except Exception as e:
			print(str(e))

	async def send_collision(self, event):
		try:
			if self.player_number != event["player"]:
				self.ball_x = event["ball_x"]
				self.ball_y = event["ball_y"]
				self.ball_z = event["ball_z"]
				self.ball_angle = event["angle"]
				self.ball_speed = event["speed"]
				self.ball_engage = event["engage"]
				self.paddle_adv_x = event["paddle_x"]
				self.paddle_adv_y = event["paddle_y"]
				await self.send(text_data=json.dumps({
					'message': event["message"],
					'player': event["player"],
					'ball_x': event["ball_x"],
					'ball_y': event["ball_y"],
					'ball_z': event["ball_z"],
					'paddle_adv_x': event["paddle_x"],
					'paddle_adv_y': event["paddle_y"],
				}))
			else:
				await self.send(text_data=json.dumps({
					'message': event["message"],
					'player': event["player"],
					'ball_x': event["ball_x"],
					'ball_y': event["ball_y"],
					'ball_z': event["ball_z"],
					'paddle_x': event["paddle_x"],
					'paddle_y': event["paddle_y"]
				}))
		except Exception as e:
			print(str(e))

	async def send_paddles(self, event):
		try:
			if self.player_number != event["player"]:
				self.paddle_adv_x = event["paddle_x"]
				self.paddle_adv_y = event["paddle_y"]
				await self.send(text_data=json.dumps({
					'message': event["message"],
					'player': event["player"],
					'paddle_adv_x': event["paddle_x"],
					'paddle_adv_y': event["paddle_y"],
				}))
		except Exception as e:
			print(str(e))

	async def match_found(self, event):
		try:
			await self.send(text_data=json.dumps({
				'message': event["message"],
				'player': self.player_number,
				'id_1': event["id_1"],
				'id_2': event["id_2"],
				'player_1': event["player_1"],
				'player_2': event["player_2"],
				'ball_initial_angle': event["ball_initial_angle"]
			}))
		except Exception as e:
			print(str(e))
