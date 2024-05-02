from rest_framework import serializers

class logUser(serializers.Serializer):
	username = serializers.CharField()
	password = serializers.CharField()
