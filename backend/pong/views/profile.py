from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from pong.dto import *
from pong.models import *
from pong.decorators.jwt_required_decorator import jwt_required
from django.contrib.auth.hashers import check_password, make_password
from django.views.decorators.csrf import csrf_protect
import os
import base64
from pong.utils import *

@api_view(['GET'])
@jwt_required
def	getMyProfile(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	profile_data = {
		'id': user.id,
    	'username': user.username,
        'victory': user.victory,
        'games': user.games,
		'winStreak': user.winStreak,
		'biggestWinStreak': user.biggestWinStreak,
		'winInTournaments': user.winInTournaments,
		'tournaments': user.tournaments,
		'winStreakInTournament': user.winStreakInTournament,
		'biggestWinStreakInTournament': user.biggestWinStreakInTournament,
        'mail': user.mail,
        'twoFactorAuth': user.twoFactorAuth,
    }
	if user.avatar:
		try:
			with open(user.avatar.path, "rb") as image_file:
				encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				profile_data['avatar'] = encoded_image
		except Exception as e:
			return Response(profile_data, status=status.HTTP_200_OK)
	return Response(profile_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@jwt_required
def	getOtherProfile(request):
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
	profile_data = {
		'id': user.id,
    	'username': user.username,
        'victory': user.victory,
        'games': user.games,
		'winStreak': user.winStreak,
		'biggestWinStreak': user.biggestWinStreak,
		'winInTournaments': user.winInTournaments,
		'tournaments': user.tournaments,
		'winStreakInTournament': user.winStreakInTournament,
		'biggestWinStreakInTournament': user.biggestWinStreakInTournament,
    }
	if user.avatar:
		try:
			with open(user.avatar.path, "rb") as image_file:
				encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				profile_data['avatar'] = encoded_image
		except Exception as e:
			return Response(profile_data, status=status.HTTP_200_OK)
	return Response(profile_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@jwt_required
def getMyFollows(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	follows = []
	if user.followed:
		follows = user.followed.split(',')
	int_follows = []
	for char in follows:
		if char:
			int_follows.append(int(char))
	tab_follows = User.objects.filter(id__in=int_follows)
	follows_data = []
	for follow in tab_follows:
		if follow.avatar:
			try:
				with open(follow.avatar.path, "rb") as image_file:
					encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
			except Exception as e:
				encoded_image = None
		else:
			encoded_image = None
		follows_data.append({
			'id': follow.id,
			'username': follow.username,
			'status': follow.status,
			'victory': follow.victory,
			'games': follow.games,
			'biggestWinStreak': follow.biggestWinStreak,
			'avatar': encoded_image,
		})
	return Response(follows_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@jwt_required
def getMyRequests(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	requests = []
	if user.requestFollowed:
		requests = user.requestFollowed.split(',')
	int_requests = []
	for char in requests:
		if char:
			int_requests.append(int(char))
	tab_requests = User.objects.filter(id__in=int_requests)
	requests_data = []
	for request in tab_requests:
		if request.avatar:
			try:
				with open(request.avatar.path, "rb") as image_file:
					encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
			except Exception as e:
				encoded_image = None
		else:
			encoded_image = None
		requests_data.append({
			'id': request.id,
			'username': request.username,
			'avatar': encoded_image,
		})
	return Response(requests_data, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def requestFollow(request):
	if len(request.data) > 1:
		return Response("Only 'username' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setRequestFollow(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	follow = None
	try:
		follow = User.objects.get(username=serializer.validated_data['username'])
	except Exception as e:
		return Response("Invalid username", status=status.HTTP_400_BAD_REQUEST)
	follows = []
	if user.followed:
		follows = user.followed.split(',')
	if str(follow.id) in follows:
		return Response("User already followed", status=status.HTTP_400_BAD_REQUEST)
	tab_requests = []
	if follow.requestFollowed:
		tab_requests = follow.requestFollowed.split(',')
	if str(user.id) in tab_requests:
		return Response("OK", status=status.HTTP_200_OK)
	follow.requestFollowed += str(user.id) + ','
	follow.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def acceptFollow(request):
	if len(request.data) > 1:
		return Response("Only 'id' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setFollow(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	request_follow = None
	try:
		request_follow = User.objects.get(id=serializer.validated_data['id'])
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	tab_requests = []
	if user.requestFollowed:
		tab_requests = user.requestFollowed.split(',')
	if str(request_follow.id) not in tab_requests:
		return Response("No followed request", status=status.HTTP_400_BAD_REQUEST)
	tab_requests.remove(str(request_follow.id))
	user.requestFollowed = ''
	for char in tab_requests:
		if char:
			user.requestFollowed += char + ','
	user.save()
	follows = []
	if user.followed:
		follows = user.followed.split(',')
	if str(request_follow.id) in follows:
		return Response("OK", status=status.HTTP_200_OK)
	user.followed += str(request_follow.id) + ','
	request_follow.followed += str(user.id) + ','
	tab_requests = []
	if request_follow.requestFollowed:
		tab_requests = request_follow.requestFollowed.split(',')
	if str(user.id) in tab_requests:
		tab_requests.remove(str(user.id))
		request_follow.requestFollowed = ''
		for char in tab_requests:
			if char:
				request_follow.requestFollowed += char + ','
	user.save()
	request_follow.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def refuseFollow(request):
	if len(request.data) > 1:
		return Response("Only 'id' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = unsetFollow(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	request_follow = None
	try:
		request_follow = User.objects.get(id=serializer.validated_data['id'])
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	tab_requests = []
	if user.requestFollowed:
		tab_requests = user.requestFollowed.split(',')
	if str(request_follow.id) not in tab_requests:
		return Response("No followed request", status=status.HTTP_400_BAD_REQUEST)
	tab_requests.remove(str(request_follow.id))
	user.requestFollowed = ''
	for char in tab_requests:
		if char:
			user.requestFollowed += char + ','
	user.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def delFollow(request):
	if len(request.data) > 1:
		return Response("Only 'id' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = unsetFollow(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	follow = None
	try:
		follow = User.objects.get(id=serializer.validated_data['id'])
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	follows = []
	if user.followed:
		follows = user.followed.split(',')
	if str(follow.id) not in follows:
		return Response("User not followed", status=status.HTTP_400_BAD_REQUEST)
	follows.remove(str(follow.id))
	user.followed = ''
	for char in follows:
		if char:
			user.followed += char + ','
	user.save()
	follows = []
	if follow.followed:
		follows = follow.followed.split(',')
	if str(user.id) not in follows:
		return Response("OK", status=status.HTTP_200_OK)
	follows.remove(str(user.id))
	follow.followed = ''
	for char in follows:
		if char:
			follow.followed += char + ','
	follow.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['POST'])
@csrf_protect
@jwt_required
def	setAvatar(request):
	if len(request.data) > 1:
		return Response("Only 'avatar' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = uploadAvatar(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	if user.avatar != "":
		old_avatar = user.avatar.path
		if os.path.exists(old_avatar):
			os.remove(old_avatar)
	user.avatar = serializer.validated_data['avatar']
	user.save()
	return Response("OK", status=status.HTTP_201_CREATED)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def	updateUsername(request):
	if len(request.data) > 1:
		return Response("Only 'username' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setUsername(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	query = User.objects.filter(username=serializer.validated_data['username'])
	if query.count() > 0 and query[0].id != user.id:
		return Response("Username already exists", status=status.HTTP_400_BAD_REQUEST)
	elif query.count() == 0:
		user.username = serializer.validated_data['username']
		user.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def	updateMail(request):
	if len(request.data) > 1:
		return Response("Only 'mail' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setMail(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	query = User.objects.filter(mail=serializer.validated_data['mail'])
	if query.count() > 0 and query[0].id != user.id:
		return Response("Mail already exists", status=status.HTTP_400_BAD_REQUEST)
	elif query.count() == 0:
		user.mail = serializer.validated_data['mail']
		user.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def	updatePassword(request):
	if len(request.data) > 2:
		return Response("Only 'new_password' and 'old_password' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setPassword(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	if check_password(serializer.validated_data['old_password'], user.password) == True:
		if check_password(serializer.validated_data['new_password'], user.password) == False:
			hash_pass = make_password(serializer.validated_data['new_password'])
			if check_password(serializer.validated_data['new_password'], hash_pass) == False:
				return Response("Invalid new password", status=status.HTTP_400_BAD_REQUEST)
			user.password = hash_pass
			user.save()
			return Response("OK", status=status.HTTP_200_OK)
		return Response("Same new password", status=status.HTTP_200_OK)
	return Response("Invalid password", status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def	update2FA(request):
	if len(request.data) > 1:
		return Response("Only 'twoFactorAuth' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = set2FA(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	if serializer.validated_data['twoFactorAuth'] != user.twoFactorAuth:
		user.twoFactorAuth = serializer.validated_data['twoFactorAuth']
		user.save()
	return Response("OK", status=status.HTTP_200_OK)

@api_view(['PATCH'])
@csrf_protect
@jwt_required
def	updateStatus(request):
	if len(request.data) > 1:
		return Response("Only 'status' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = setStatus(data=request.data)
	if serializer.is_valid() == False:
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	if serializer.validated_data['status'] == "online":
		user.status = User.Status.ONLINE
	elif serializer.validated_data['status'] == "offline":
		user.status = User.Status.OFFLINE
	elif serializer.validated_data['status'] == "in game":
		user.status = User.Status.IN_GAME
	else:
		return Response("Invalid status", status=status.HTTP_400_BAD_REQUEST)
	user.save()
	return Response("OK", status=status.HTTP_200_OK)
	