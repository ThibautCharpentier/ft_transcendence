from rest_framework import serializers

class setTournament(serializers.Serializer):
	first = serializers.IntegerField()
	second = serializers.IntegerField()
	third = serializers.IntegerField()
	fourth = serializers.IntegerField(required=False)
	fifth = serializers.IntegerField(required=False)
	sixth = serializers.IntegerField(required=False)
	seventh = serializers.IntegerField(required=False)
