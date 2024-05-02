from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

def jwt_required(func):
	def wrapper(request):
		try:
			raw_token = request.COOKIES.get('access_token', None)
			if raw_token == None:
				return Response("Token not found", status=status.HTTP_401_UNAUTHORIZED)
			token = JWTAuthentication().get_validated_token(raw_token)
			request.user_id = token.payload.get('user_id')
		except Exception as e:
			return Response(str(e), status=status.HTTP_403_FORBIDDEN)
		return func(request)
	return wrapper
