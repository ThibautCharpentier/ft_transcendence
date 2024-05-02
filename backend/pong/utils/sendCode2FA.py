from pong.models import *
from django.core.mail import send_mail
from rest_framework.response import Response
from rest_framework import status
import random

def	sendCode2FA(user):
	random.seed()
	code = ""
	for i in range(6):
		code += str(random.randint(0, 9))
	try:
		send_mail(
			"Pong Game: code 2FA",
			"Voici votre code 2FA à valider afin de vous connecter: " + code,
			'tcharpen@student.42lyon.fr',
			[user.mail]
		)
	except Exception as e:
		return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
	user.codeTwoFactorAuth = code
	user.save()
	return Response("Le code 2FA a été envoyé à l'adresse " + user.mail, status=status.HTTP_200_OK)
	