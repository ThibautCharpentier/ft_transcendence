from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password, make_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from pong.dto import *
from pong.models import *
from pong.decorators.jwt_required_decorator import jwt_required
from pong.utils import *
from datetime import datetime, timedelta
from django.shortcuts import redirect
import jwt
from django.conf import settings

@api_view(['GET'])
def	validateSSL(request):
	return redirect('https://' + request.get_host().split(':')[0] + ':8080')

@api_view(['GET'])
def	getCSRF(request):
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.set_cookie('csrf_token', get_token(request), httponly=False, secure=True)
	return response

@api_view(['GET'])
@jwt_required
def	isConnected(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	return Response(user.id, status=status.HTTP_200_OK)

@api_view(['POST'])
@csrf_protect
def signUp(request):
	if len(request.data) > 3:
		return Response("Only 'username', 'password' and 'mail' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = createUser(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	try:
		validate_password(serializer.validated_data['password'])
	except Exception as e:
		return Response("Invalid password", status=status.HTTP_400_BAD_REQUEST)
	hash_pass = make_password(serializer.validated_data['password'])
	if check_password(serializer.validated_data['password'], hash_pass) == False:
		return Response("Invalid password", status=status.HTTP_400_BAD_REQUEST)
	if User.objects.filter(username=serializer.validated_data['username']):
		return Response("Username already exists", status=status.HTTP_400_BAD_REQUEST)
	if User.objects.filter(mail=serializer.validated_data['mail']):
		return Response("Mail already exists", status=status.HTTP_400_BAD_REQUEST)
	user = User.objects.create(
		username=serializer.validated_data['username'],
		password=hash_pass,
		mail=serializer.validated_data['mail']
	)
	user.save()
	return Response("OK", status=status.HTTP_201_CREATED)

@api_view(['POST'])
@csrf_protect
def signIn(request):
	if len(request.data) > 2:
		return Response("Only 'username' and 'password' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = logUser(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = None
	try:
		user = User.objects.get(username=serializer.validated_data['username'])
	except Exception as e:
		return Response("Invalid username", status=status.HTTP_400_BAD_REQUEST)
	if check_password(serializer.validated_data['password'], user.password) == False:
		return Response("Invalid password", status=status.HTTP_400_BAD_REQUEST)
	if user.twoFactorAuth == True:
		return sendCode2FA(user)
	user.status = User.Status.ONLINE
	refresh = RefreshToken.for_user(user)
	user.save()
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True, expires=(datetime.now() + timedelta(days=1)))
	response.set_cookie('access_token', str(refresh.access_token), httponly=True, secure=True, expires=(datetime.now() + timedelta(minutes=30)))
	return response

@api_view(['POST'])
@csrf_protect
def	validate2FA(request):
	if len(request.data) > 2:
		return Response("Only 'username' and 'codeTwoFactorAuth' are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = validateCode2FA(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = None
	try:
		user = User.objects.get(username=serializer.validated_data['username'])
	except Exception as e:
		return Response("Invalid username", status=status.HTTP_400_BAD_REQUEST)
	if user.twoFactorAuth == False:
		return Response("User doesn't use 2FA", status=status.HTTP_403_FORBIDDEN)
	if user.codeTwoFactorAuth != serializer.validated_data['codeTwoFactorAuth']:
		return Response("Invalid 2FA", status=status.HTTP_400_BAD_REQUEST)
	user.codeTwoFactorAuth = ""
	user.status = User.Status.ONLINE
	refresh = RefreshToken.for_user(user)
	user.save()
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True, expires=(datetime.now() + timedelta(days=1)))
	response.set_cookie('access_token', str(refresh.access_token), httponly=True, secure=True, expires=(datetime.now() + timedelta(minutes=30)))
	return response

@api_view(['POST'])
@csrf_protect
def refresh(request):
	refresh = None
	try:
		raw_token = request.COOKIES.get('refresh_token', None)
		if raw_token == None:
			return Response("Token not found", status=status.HTTP_401_UNAUTHORIZED)
		refresh = RefreshToken(raw_token)
		request.user_id = refresh.access_token.payload.get('user_id')
	except Exception as e:
		return Response(str(e), status=status.HTTP_403_FORBIDDEN)
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	#if user.status == User.Status.OFFLINE:
	#	return Response("User offline", status=status.HTTP_403_FORBIDDEN)
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.set_cookie('refresh_token', str(refresh), httponly=True, secure=True, expires=(datetime.now() + timedelta(days=1)))
	response.set_cookie('access_token', str(refresh.access_token), httponly=True, secure=True, expires=(datetime.now() + timedelta(minutes=30)))
	return response

@api_view(['POST'])
@csrf_protect
@jwt_required
def signOut(request):
	user = getUser(request.user_id)
	if user == None:
		return Response("User not found", status=status.HTTP_400_BAD_REQUEST)
	user.status = User.Status.OFFLINE
	user.save()
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	response.delete_cookie('refresh_token')
	response.delete_cookie('access_token')
	return response

@api_view(['POST'])
@csrf_protect
@jwt_required
def authPong(request):
	if len(request.data) > 3:
		return Response("Only 'username', 'password' and are required", status=status.HTTP_400_BAD_REQUEST)
	serializer = logUser(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = None
	try:
		user = User.objects.get(username=serializer.validated_data['username'])
	except Exception as e:
		return Response("Invalid username", status=status.HTTP_400_BAD_REQUEST)
	if check_password(serializer.validated_data['password'], user.password) == False:
		return Response("Invalid password", status=status.HTTP_400_BAD_REQUEST)
	payload = {
		'user_id': user.id,
		'exp': datetime.now() + timedelta(days=1),
	}
	token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
	response = JsonResponse({
		'id': user.id,
	})
	response.status = 200
	if request.COOKIES.get('J2_token', None) == None:
		response.set_cookie('J2_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	elif request.COOKIES.get('J3_token', None) == None:
		response.set_cookie('J3_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	elif request.COOKIES.get('J4_token', None) == None:
		response.set_cookie('J4_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	elif request.COOKIES.get('J5_token', None) == None:
		response.set_cookie('J5_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	elif request.COOKIES.get('J6_token', None) == None:
		response.set_cookie('J6_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	elif request.COOKIES.get('J7_token', None) == None:
		response.set_cookie('J7_token', token, httponly=False, secure=True, expires=(datetime.now() + timedelta(days=1)))
	return response

@api_view(['POST'])
@csrf_protect
@jwt_required
def authPongOut(request):
	if len(request.data) > 1:
		return Response("Only 'id' is required", status=status.HTTP_400_BAD_REQUEST)
	serializer = logOutUserPong(data=request.data)
	if serializer.is_valid() == False:
		return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)
	user = None
	try:
		user = User.objects.get(id=serializer.validated_data['id'])
	except Exception as e:
		return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
	response = JsonResponse({
		'message': 'OK',
	})
	response.status = 200
	tokens = ['J2_token', 'J3_token', 'J4_token', 'J5_token', 'J6_token', 'J7_token']
	for i in range(0, len(tokens)):
		try:
			raw_token = request.COOKIES.get(tokens[i], None)
			if raw_token == None:
				continue
			payload = jwt.decode(raw_token, settings.SECRET_KEY, algorithms=["HS256"])
			if payload['user_id'] == user.id:
				response.delete_cookie(tokens[i])
		except Exception as e:
			response.delete_cookie(tokens[i])
	return response
	