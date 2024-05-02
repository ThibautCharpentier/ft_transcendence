from rest_framework import serializers

class setPassword(serializers.Serializer):
	new_password = serializers.CharField(min_length=10, max_length=20)
	old_password = serializers.CharField()
