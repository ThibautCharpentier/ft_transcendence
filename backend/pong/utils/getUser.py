from pong.models import *

def	getUser(user_id):
	user = None
	try:
		user = User.objects.get(id=user_id)
	except Exception as e:
		return None
	return user
