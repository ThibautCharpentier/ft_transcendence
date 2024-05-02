from django.db import models

class TournamentHistory(models.Model):
	id = models.BigAutoField(primary_key=True)
	first = models.PositiveBigIntegerField()
	second = models.PositiveBigIntegerField()
	third = models.PositiveBigIntegerField()
	fourth = models.PositiveBigIntegerField(blank=True, null=True)
	fifth = models.PositiveBigIntegerField(blank=True, null=True)
	sixth = models.PositiveBigIntegerField(blank=True, null=True)
	seventh = models.PositiveBigIntegerField(blank=True, null=True)
	date = models.DateTimeField(auto_now_add=True)

	class Meta:
		db_table = "tournament_history"

	def __str__(self):
		return str(self.id)
