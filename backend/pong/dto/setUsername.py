from rest_framework import serializers

class setUsername(serializers.Serializer):
	username = serializers.CharField(min_length=3, max_length=10)
