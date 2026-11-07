from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication
from rest_framework.throttling import ScopedRateThrottle
from django.middleware.csrf import get_token


class CsrfProtectedAPIView(APIView):
    throttle_classes = [ScopedRateThrottle]

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if not request.headers.get('Authorization'):
            SessionAuthentication().enforce_csrf(request)


class CsrfView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({'csrfToken': get_token(request)})


from institutions.models import Institution
from .cookies import clear_auth_cookies, set_auth_cookies
from .models import User
from .serializers import (
    AuthenticatedUserSerializer,
    LoginSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
)


class RegisterInstitutionView(CsrfProtectedAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_scope = 'registration'

    def post(self, request):
        from django.db import IntegrityError
        from .registration import InstitutionRegistrationSerializer
        serializer = InstitutionRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            institution = serializer.save()
        except IntegrityError:
            return Response({'detail': 'Institution or account already exists.'}, status=400)
        return Response({'message': 'Institution registered successfully. You can now log in.',
                         'institution': {'id': str(institution.id), 'name': institution.name}}, status=201)


class LoginView(CsrfProtectedAPIView):
    throttle_scope = 'login'
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        response = Response(
            {
                'message': 'Login successful.',
                'user': AuthenticatedUserSerializer(serializer.validated_data['user']).data,
                'tokens': {
                    'access': serializer.validated_data['access'],
                    'refresh': serializer.validated_data['refresh'],
                },
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(
            response,
            access_token=serializer.validated_data['access'],
            refresh_token=serializer.validated_data['refresh'],
        )
        return response


class RefreshView(CsrfProtectedAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RefreshTokenSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        response = Response(
            {
                'message': 'Token refresh successful.',
                'tokens': serializer.validated_data,
            },
            status=status.HTTP_200_OK,
        )
        set_auth_cookies(
            response,
            access_token=serializer.validated_data['access'],
            refresh_token=serializer.validated_data.get('refresh'),
        )
        return response


class LogoutView(CsrfProtectedAPIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LogoutSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response = Response(
            {'message': 'Logout successful.'},
            status=status.HTTP_200_OK,
        )
        clear_auth_cookies(response)
        return response


class MeView(APIView):
    def get(self, request):
        return Response(AuthenticatedUserSerializer(request.user).data, status=status.HTTP_200_OK)


class TeachingStaffView(APIView):
    def get(self, request):
        from core.permissions import ADMIN_ROLES
        if request.user.user_type not in ADMIN_ROLES | {'TEACHER'} and not request.user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        users = User.objects.filter(institution=request.user.institution, is_active=True,
            user_type__in=['TEACHER','PRINCIPAL','INSTITUTION_ADMIN'])
        return Response([{'id':u.pk,'full_name':u.full_name or u.phone_number} for u in users])
