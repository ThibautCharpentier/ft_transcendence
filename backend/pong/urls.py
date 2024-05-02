from django.urls import path
from .views import auth
from .views import profile
from .views import history

urlpatterns = [
	path("", auth.validateSSL),
	path("auth/getcsrf", auth.getCSRF),
	path("auth/myconnection", auth.isConnected),
	path("auth/signup", auth.signUp),
	path("auth/signin", auth.signIn),
	path("auth/validate2fa", auth.validate2FA),
	path("auth/refresh", auth.refresh),
	path("auth/signout", auth.signOut),
	path("auth/pong", auth.authPong),
	path("auth/pongout", auth.authPongOut),
	path("profile/getmyprofile", profile.getMyProfile),
	path("profile/getotherprofile", profile.getOtherProfile),
	path("profile/getmyfollows", profile.getMyFollows),
	path("profile/getmyrequests", profile.getMyRequests),
	path("profile/requestfollow", profile.requestFollow),
	path("profile/acceptfollow", profile.acceptFollow),
	path("profile/refusefollow", profile.refuseFollow),
	path("profile/delfollow", profile.delFollow),
	path("profile/setavatar", profile.setAvatar),
	path("profile/updateusername", profile.updateUsername),
	path("profile/updatemail", profile.updateMail),
	path("profile/updatepassword", profile.updatePassword),
	path("profile/update2fa", profile.update2FA),
	path("profile/updatestatus", profile.updateStatus),
	path("history/getmygames", history.getMyGames),
	path("history/getothergames", history.getOtherGames),
	path("history/addmatch", history.addMatch),
	path("history/addtournament", history.addTournament),
]
