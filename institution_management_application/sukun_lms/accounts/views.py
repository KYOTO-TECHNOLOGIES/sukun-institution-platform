from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from institutions.models import Institution
from .cookies import clear_auth_cookies, set_auth_cookies
from .models import User
from .serializers import (
    AuthenticatedUserSerializer,
    LoginSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
)


class RegisterInstitutionView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        name = request.data.get('name')
        registration_number = request.data.get('registration_number')
        phone = request.data.get('phone')
        email = request.data.get('email', '')
        address = request.data.get('address', '')
        
        admin_first_name = request.data.get('admin_first_name', 'Admin')
        admin_last_name = request.data.get('admin_last_name', 'User')
        admin_phone = request.data.get('admin_phone') or phone
        admin_password = request.data.get('admin_password', 'Password@123')

        if not name or not registration_number or not admin_phone or not admin_password:
            return Response(
                {'error': 'Institution Name, Registration Number, Admin Phone, and Password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        inst_email = email or f"admin_{registration_number.lower().replace(' ', '_')}@sukun.edu"

        institution, _ = Institution.objects.get_or_create(
            registration_number=registration_number,
            defaults={
                'name': name,
                'phone': phone or admin_phone,
                'email': inst_email,
                'address': address or 'Main Campus Address',
                'city': request.data.get('city', 'Calicut'),
                'district': request.data.get('district', 'Kozhikode'),
                'state': request.data.get('state', 'Kerala'),
                'pincode': request.data.get('pincode', '673001'),
                'established_year': int(request.data.get('established_year', 2026)),
                'institution_type': request.data.get('institution_type', 'MADRASA')
            }
        )

        user = User.objects.filter(phone_number=admin_phone).first()
        if not user:
            user = User.objects.create_user(
                phone_number=admin_phone,
                password=admin_password,
                first_name=admin_first_name,
                last_name=admin_last_name,
                email=inst_email,
                user_type='INSTITUTION_ADMIN',
                institution=institution,
                is_staff=True
            )
        else:
            user.institution = institution
            user.user_type = 'INSTITUTION_ADMIN'
            user.set_password(admin_password)
            user.save()

        # Sync exam institution automatically
        try:
            from exam_seating.services import sync_exam_institution_from_lms
            sync_exam_institution_from_lms(institution)
        except Exception:
            pass

        return Response({
            'message': 'Institution registered successfully! You can now log in.',
            'institution': {'id': str(institution.id), 'name': institution.name},
            'admin_phone': admin_phone
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
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


class RefreshView(APIView):
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


class LogoutView(APIView):
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
