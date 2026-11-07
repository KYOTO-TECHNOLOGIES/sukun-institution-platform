from pathlib import Path
from django.apps import apps
from django.conf import settings
from django.db.models import FileField
from django.http import FileResponse
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from .permissions import can_access
from .tenancy import owner_id


class ProtectedMediaView(APIView):
    def get(self,request,filename):
        root=Path(settings.MEDIA_ROOT).resolve()
        path=(root/filename).resolve()
        if not path.is_relative_to(root) or not path.is_file(): raise NotFound()
        allowed=False
        for model in apps.get_models():
            for field in model._meta.fields:
                if not isinstance(field,FileField): continue
                for obj in model.objects.filter(**{field.name:filename})[:10]:
                    if request.user.is_superuser: allowed=True; break
                    if owner_id(obj)!=str(request.user.institution_id): continue
                    if model._meta.label_lower=='institutions.institution': allowed=True; break
                    if request.user.user_type not in {'STUDENT','PARENT'} and can_access(request.user,model._meta.app_label):
                        allowed=True; break
                    student=getattr(obj,'student',None)
                    if getattr(obj,'user_id',None)==request.user.pk or model._meta.label_lower=='accounts.user' and obj.pk==request.user.pk:
                        allowed=True; break
                    if student and (student.user_id==request.user.pk or student.parents.filter(user=request.user).exists()):
                        allowed=True; break
                if allowed: break
            if allowed: break
        if not allowed: raise NotFound()
        response=FileResponse(path.open('rb'),as_attachment=True,filename=path.name)
        response['Cache-Control']='private, no-store'
        response['X-Content-Type-Options']='nosniff'
        return response
