from rest_framework import serializers

class setRequestFollow(serializers.Serializer):
	username = serializers.CharField()
