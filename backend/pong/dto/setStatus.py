from rest_framework import serializers

class setStatus(serializers.Serializer):
	status = serializers.CharField()
