from rest_framework import serializers

class set2FA(serializers.Serializer):
	twoFactorAuth = serializers.BooleanField()