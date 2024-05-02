from django.db import models
from django.core.validators import int_list_validator

def avatar_directory_path(instance, filename):
	return "user_{0}/{1}".format(instance.id, filename)

class User(models.Model):
	class Status(models.TextChoices):
		OFFLINE = "offline"
		ONLINE = "online"
		IN_GAME = "in game"

	id = models.BigAutoField(primary_key=True)
	username = models.CharField(max_length=10, unique=True)
	password = models.CharField()
	status = models.CharField(
		choices=Status.choices,
		default=Status.OFFLINE
	)
	avatar = models.ImageField(upload_to=avatar_directory_path, blank=True)
	victory = models.PositiveBigIntegerField(default=0)
	games = models.PositiveBigIntegerField(default=0)
	winStreak = models.PositiveBigIntegerField(default=0)
	biggestWinStreak = models.PositiveBigIntegerField(default=0)
	winInTournaments = models.PositiveBigIntegerField(default=0)
	tournaments = models.PositiveBigIntegerField(default=0)
	winStreakInTournament = models.PositiveBigIntegerField(default=0)
	biggestWinStreakInTournament = models.PositiveBigIntegerField(default=0)
	mail = models.EmailField(unique=True)
	twoFactorAuth = models.BooleanField(default=False)
	codeTwoFactorAuth = models.CharField(max_length=6, blank=True)
	followed = models.CharField(validators=[int_list_validator], blank=True)
	requestFollowed = models.CharField(validators=[int_list_validator], blank=True)

	class Meta:
		db_table = "user"

	def __str__(self):
		return str(self.id)
