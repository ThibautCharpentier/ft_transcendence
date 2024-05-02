from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_protect
from pong.dto import *
from pong.models import *
from pong.decorators.jwt_required_decorator import jwt_required
from pong.utils import *
from django.http import JsonResponse
import jwt
from django.conf import settings

@api_view(['GET'])
@jwt_required
def	getMyGames(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	tab_matches = getMatchesHistory(request.user_id)
	tab_tournaments = getTournamentsHistory(request.user_id)
	tab_all = []
	for match in tab_matches:
		tab_all.append(match.date)
	for tournament in tab_tournaments:
		tab_all.append(tournament.date)
	tab_all = insertSort(tab_all)
	return sendHistory(tab_all, tab_matches, tab_tournaments)

@api_view(['GET'])
@jwt_required
def	getOtherGames(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	user = None
	try:
		user = User.objects.get(id=request.GET['id'])
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	tab_matches = getMatchesHistory(user.id)
	tab_tournaments = getTournamentsHistory(user.id)
	tab_all = []
	for match in tab_matches:
		tab_all.append(match.date)
	for tournament in tab_tournaments:
		tab_all.append(tournament.date)
	tab_all = insertSort(tab_all)
	return sendHistory(tab_all, tab_matches, tab_tournaments)

@api_view(['POST'])
@csrf_protect
@jwt_required
def	addMatch(request):
	if len(request.data) > 4:
		return Response("Only 'winner', 'looser', 'looserScore' and 'matchType' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setMatch(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	if serializer.validated_data['matchType'] != 'offline' and serializer.validated_data['matchType'] != 'online':
		return Response("Invalid matchType", status=status.HTTP_400_BAD_REQUEST)
	if request.user_id != serializer.validated_data['winner'] and request.user_id != serializer.validated_data['looser']:
		return Response("Invalid player", status=status.HTTP_401_UNAUTHORIZED)
	try:
		raw_token = request.COOKIES.get('J2_token', None)
		if raw_token == None:
			return Response("Token not found", status=status.HTTP_401_UNAUTHORIZED)
		payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
		if payload['user_id'] != serializer.validated_data['winner'] and payload['user_id'] != serializer.validated_data['looser']:
			return Response("Invalid player", status=status.HTTP_401_UNAUTHORIZED)
	except Exception as e:
		return Response(str(e), status=status.HTTP_403_FORBIDDEN)
	user = []
	try:
		user.append(User.objects.get(id=serializer.validated_data['winner']))
		user.append(User.objects.get(id=serializer.validated_data['looser']))
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	if user[0].id == user[1].id:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	match = MatchHistory.objects.create(
		winner=user[0].id,
		looser=user[1].id,
		looserScore=serializer.validated_data['looserScore'],
		matchType=serializer.validated_data['matchType']
	)
	match.save()
	user[0].games += 1
	user[0].victory += 1
	user[0].winStreak += 1
	if user[0].winStreak > user[0].biggestWinStreak:
		user[0].biggestWinStreak = user[0].winStreak
	user[0].save()
	user[1].games += 1
	user[1].winStreak = 0
	user[1].save()
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.delete_cookie('J2_token')
	return response

@api_view(['POST'])
@csrf_protect
@jwt_required
def	addTournament(request):
	if len(request.data) > 7:
		return Response("Only 'first', 'second', 'third', 'fourth', 'fifth', 'sixth' and 'seventh' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setTournament(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = []
	nb_player = 0
	try:
		for player in serializer.validated_data:
			user.append(User.objects.get(id=serializer.validated_data[player]))
			nb_player += 1
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	for i in range(0, nb_player):
		for j in range(0, nb_player):
			if j != i and user[i].id == user[j].id:
				return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	check = False
	for i in range(0, nb_player):
		if request.user_id == user[i].id:
			check = True
			break
	if check == False:
		return Response("Invalid player", status=status.HTTP_401_UNAUTHORIZED)
	tokens = ['J2_token', 'J3_token', 'J4_token', 'J5_token', 'J6_token', 'J7_token']
	nb_check = 1
	try:
		for i in range(0, len(tokens)):
			raw_token = request.COOKIES.get(tokens[i], None)
			if raw_token == None:
				continue
			nb_check += 1
			payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
			check = False
			for j in range(0, nb_player):
				if payload['user_id'] == user[j].id:
					check = True
					break
			if check == False:
				return Response("Invalid player", status=status.HTTP_401_UNAUTHORIZED)
	except Exception as e:
		return Response(str(e), status=status.HTTP_403_FORBIDDEN)
	if nb_check != nb_player:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	tournament = TournamentHistory.objects.create(
		first=user[0].id,
		second=user[1].id,
		third=user[2].id
	)
	user[0].tournaments += 1
	user[0].winInTournaments += 1
	user[0].winStreakInTournament += 1
	if user[0].winStreakInTournament > user[0].biggestWinStreakInTournament:
		user[0].biggestWinStreakInTournament = user[0].winStreakInTournament
	user[0].save()
	user[1].tournaments += 1
	user[1].winStreakInTournament = 0
	user[1].save()
	user[2].tournaments += 1
	user[2].winStreakInTournament = 0
	user[2].save()
	if nb_player > 3:
		tournament.fourth = user[3].id
		user[3].tournaments += 1
		user[3].winStreakInTournament = 0
		user[3].save()
	if nb_player > 4:
		tournament.fifth = user[4].id
		user[4].tournaments += 1
		user[4].winStreakInTournament = 0
		user[4].save()
	if nb_player > 5:
		tournament.sixth = user[5].id
		user[5].tournaments += 1
		user[5].winStreakInTournament = 0
		user[5].save()
	if nb_player > 6:
		tournament.seventh = user[6].id
		user[6].tournaments += 1
		user[6].winStreakInTournament = 0
		user[6].save()
	tournament.save()
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	for i in range(0, len(tokens)):
		response.delete_cookie(tokens[i])
	return response
