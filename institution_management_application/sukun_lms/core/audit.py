import logging
from rest_framework import serializers
from .models import AuditEvent
from .viewsets import SecureModelViewSet


class AuditMiddleware:
    def __init__(self,get_response): self.get_response=get_response
    def __call__(self,request):
        response=self.get_response(request)
        user=getattr(request,'user',None)
        if request.path.startswith('/api/') and request.method in {'POST','PUT','PATCH','DELETE'} and response.status_code<400 and user and user.is_authenticated and user.institution_id:
            try:
                AuditEvent.objects.create(institution_id=user.institution_id,actor=user,action=request.method,
                    path=request.path[:500],status_code=response.status_code)
            except Exception:
                logging.getLogger(__name__).exception('Could not record audit event')
        return response


class AuditSerializer(serializers.ModelSerializer):
    actor_name=serializers.CharField(source='actor.full_name',read_only=True)
    class Meta:
        model=AuditEvent; fields='__all__'


class AuditViewSet(SecureModelViewSet):
    queryset=AuditEvent.objects.select_related('actor')
    serializer_class=AuditSerializer
    http_method_names=['get','head','options']
