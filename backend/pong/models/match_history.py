from django.db import models

class MatchHistory(models.Model):
	class MatchType(models.TextChoices):
		OFFLINE = "offline"
		ONLINE = "online"

	id = models.BigAutoField(primary_key=True)
	matchType = models.CharField(
		choices=MatchType.choices,
		default=MatchType.OFFLINE
	)
	winner = models.PositiveBigIntegerField()
	looser = models.PositiveBigIntegerField()
	looserScore = models.IntegerField()
	date = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = "match_history"

	def __str__(self):
		return str(self.id)
