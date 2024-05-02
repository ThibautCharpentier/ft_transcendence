from rest_framework import serializers

class createUser(serializers.Serializer):
	username = serializers.CharField(min_length=3, max_length=10)
	password = serializers.CharField(min_length=10, max_length=20)
	mail = serializers.EmailField()
