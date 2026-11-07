from core.viewsets import SecureModelViewSet

from .models import User
from .serializers import UserSerializer


class UserViewSet(SecureModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    institution_lookup = 'institution_id'


    def perform_destroy(self, instance):
        from rest_framework.exceptions import ValidationError
        raise ValidationError('Deactivate an account to preserve its academic and financial history.')

    def validate_write(self,serializer):
        super().validate_write(serializer)
        if serializer.instance and serializer.instance.pk==self.request.user.pk:
            from rest_framework.exceptions import ValidationError
            if any(key in serializer.validated_data for key in ['user_type','permission_overrides','is_active','is_staff']):
                for key in ['user_type','permission_overrides','is_active','is_staff']:
                    if key in serializer.validated_data and serializer.validated_data[key]!=getattr(serializer.instance,key):
                        raise ValidationError('Ask another administrator to change your own access or role.')
