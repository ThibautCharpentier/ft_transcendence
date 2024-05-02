from pong.models import *
from django.db.models import Q

def	getMatchesHistory(user_id):
	return MatchHistory.objects.filter(Q(winner=user_id) | Q(looser=user_id)).order_by('-date')[:10]
