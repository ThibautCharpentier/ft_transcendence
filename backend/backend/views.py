from django.http import HttpResponseNotFound
from django.http import HttpResponseServerError

def error404(request, exception):
	return HttpResponseNotFound("Error 404: " + request.path_info)

def error500(request):
	return HttpResponseServerError("Error 500: Server Error")
