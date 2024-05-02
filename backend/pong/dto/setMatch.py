from rest_framework import serializers

class setMatch(serializers.Serializer):
	winner = serializers.IntegerField()
	looser = serializers.IntegerField()
	looserScore = serializers.IntegerField()
	matchType = serializers.CharField()
