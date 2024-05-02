from rest_framework import serializers

class uploadAvatar(serializers.Serializer):
	avatar = serializers.ImageField()
