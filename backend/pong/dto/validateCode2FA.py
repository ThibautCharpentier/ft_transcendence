from rest_framework import serializers

class validateCode2FA(serializers.Serializer):
	username = serializers.CharField()
	codeTwoFactorAuth = serializers.CharField(min_length=6, max_length=6)
