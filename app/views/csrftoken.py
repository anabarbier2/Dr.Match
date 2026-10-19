from django.http import JsonResponse
from django.views import View
from django.middleware.csrf import get_token


class CsrfTokenView(View):
    def get(self, request):
        return JsonResponse({'csrfToken': get_token(request)})
