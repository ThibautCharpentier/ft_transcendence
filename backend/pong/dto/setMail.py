from rest_framework import serializers

class setMail(serializers.Serializer):
	mail = serializers.EmailField()
