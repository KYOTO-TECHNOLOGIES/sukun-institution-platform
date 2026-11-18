from django.http import JsonResponse


class SecurityHeadersMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        try:
            length = int(request.META.get('CONTENT_LENGTH') or 0)
        except (ValueError, TypeError):
            return JsonResponse({'detail':'Invalid Content-Length header.'},status=400)
        if length < 0:
            return JsonResponse({'detail':'Invalid Content-Length header.'},status=400)
        if length>10*1024*1024:
            return JsonResponse({'detail':'Uploads are limited to 10 MB per request.'},status=413)
        response=self.get_response(request)
        if request.path.startswith('/api/'):
            response['Cache-Control']='private, no-store'
        response.setdefault('Referrer-Policy','same-origin')
        response.setdefault('Permissions-Policy','camera=(), microphone=(), geolocation=()')
        return response
