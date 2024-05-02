from pong.models import *
from rest_framework.response import Response
from rest_framework import status
import base64

def	sendHistory(tab_all, tab_matches, tab_tournaments):
	tab_data = []
	winner = None
	looser = None
	if len(tab_all) > 10:
		N = 10
	else:
		N = len(tab_all)
	if tab_all != None:
		for i in range(0, N):
			next_i = False
			for match in tab_matches:
				if tab_all[i] == match.date:
					winnerAvatar = None
					looserAvatar = None
					try:
						winner = User.objects.get(id=match.winner)
						looser = User.objects.get(id=match.looser)
					except Exception as e:
						return Response("Internal server error", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
					if winner.avatar:
						try:
							with open(winner.avatar.path, "rb") as image_file:
								encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
								winnerAvatar = encoded_image
						except Exception as e:
							looserAvatar = None
					if looser.avatar:
						try:
							with open(looser.avatar.path, "rb") as image_file:
								encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
								looserAvatar = encoded_image
						except Exception as e:
							looserAvatar = None
					tab_data.append({
						'matchType': match.matchType,
						'winner': winner.username,
						'winnerId': winner.id,
						'winnerAvatar': winnerAvatar,
						'looser': looser.username,
						'looserId': looser.id,
						'looserAvatar': looserAvatar,
						'looserScore': match.looserScore,
						'date': match.date.strftime("%d/%m/%Y %H:%M"),
					})
					next_i = True
					break
			if next_i == True:
				continue
			for tournament in tab_tournaments:
				if tab_all[i] == tournament.date:
					player = []
					avatar = []
					for j in range(0, 7):
						avatar.append(None)
						player.append(None)
					try:
						player[0] = User.objects.get(id=tournament.first)
						player[1] = User.objects.get(id=tournament.second)
						player[2] = User.objects.get(id=tournament.third)
						if tournament.fourth != None:
							player[3] = User.objects.get(id=tournament.fourth)
						if tournament.fifth != None:
							player[4] = User.objects.get(id=tournament.fifth)
						if tournament.sixth != None:
							player[5] = User.objects.get(id=tournament.sixth)
						if tournament.seventh != None:
							player[6] = User.objects.get(id=tournament.seventh)
					except Exception as e:
						return Response("Internal server error", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
					for j in range(0, len(player)):
						if player[j] != None and player[j].avatar:
							try:
								with open(player[j].avatar.path, "rb") as image_file:
									encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
									avatar[j] = encoded_image
							except Exception as e:
								avatar[j] = None
					name = []
					id = []
					for j in range(0, len(player)):
						if player[j] != None:
							name.append(player[j].username)
							id.append(player[j].id)
					tab_data.append({
						'players': name,
						'id': id,
						'avatars': avatar,
						'date': tournament.date.strftime("%d/%m/%Y %H:%M"),
					})
					break
	return Response(tab_data, status=status.HTTP_200_OK)
