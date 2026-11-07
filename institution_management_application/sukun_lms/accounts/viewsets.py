from core.viewsets import SecureModelViewSet

from .models import User
from .serializers import UserSerializer


class UserViewSet(SecureModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    institution_lookup = 'institution_id'
