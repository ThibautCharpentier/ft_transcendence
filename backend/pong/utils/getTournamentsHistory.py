from pong.models import *
from django.db.models import Q

def	getTournamentsHistory(user_id):
	return TournamentHistory.objects.filter(Q(first=user_id) | Q(second=user_id) | Q(third=user_id) | Q(fourth=user_id) | Q(fifth=user_id) | Q(sixth=user_id) | Q(seventh=user_id)).order_by('-date')[:10]
