from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .utils import get_bearer_token, normalize_phone_number


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'phone_number',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'user_type',
            'address',
            'profile_picture',
            'institution',
            'date_of_birth',
            'blood_group',
            'is_phone_verified',
            'is_active',
            'is_staff',
            'date_joined',
            'updated_at',
            'password',
        )
        read_only_fields = ('id', 'date_joined', 'updated_at', 'full_name')
        extra_kwargs = {
            'is_staff': {'required': False},
            'is_active': {'required': False},
            'is_phone_verified': {'required': False},
        }

    def validate(self, attrs):
        if attrs.get('password'):
            try:
                validate_password(attrs['password'], user=self.instance or User(**{k: v for k, v in attrs.items() if k != 'password'}))
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': exc.messages})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        if not password:
            raise serializers.ValidationError({'password': 'Password is required.'})
        return User.objects.create_user(password=password, **validated_data)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AuthenticatedUserSerializer(serializers.ModelSerializer):
    page_permission = serializers.SerializerMethodField()

    def get_page_permission(self, user):
        from .permissions_map import page_permissions
        return page_permissions(user)

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            'id',
            'page_permission',
            'phone_number',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'user_type',
            'institution',
            'is_phone_verified',
            'date_joined',
        )
        read_only_fields = fields


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    password = serializers.CharField(trim_whitespace=False, style={'input_type': 'password'})

    def validate(self, attrs):
        request = self.context.get('request')
        try:
            normalized_phone_number = normalize_phone_number(attrs['phone_number'])
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'phone_number': exc.messages})
        user = authenticate(
            request=request,
            phone_number=normalized_phone_number,
            password=attrs['password'],
        )

        if not user:
            raise AuthenticationFailed('Invalid phone number or password.')

        if not user.is_active:
            raise AuthenticationFailed('Your account is inactive.')

        refresh = RefreshToken.for_user(user)

        attrs['user'] = user
        attrs['access'] = str(refresh.access_token)
        attrs['refresh'] = str(refresh)
        return attrs


class RefreshTokenSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=False)

    def validate(self, attrs):
        refresh_token = self._get_refresh_token(attrs)
        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as exc:
            raise AuthenticationFailed('Invalid or expired refresh token.') from exc
        return serializer.validated_data

    def _get_refresh_token(self, attrs) -> str:
        request = self.context['request']
        refresh_token = (
            attrs.get('refresh')
            or request.COOKIES.get(settings.JWT_AUTH['REFRESH_COOKIE_NAME'])
            or get_bearer_token(request)
        )

        if not refresh_token:
            raise serializers.ValidationError(
                {'refresh': 'Refresh token is required in body, cookie, or Authorization header.'}
            )

        return refresh_token


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(required=False, allow_blank=False)

    def validate(self, attrs):
        attrs['refresh'] = self._get_refresh_token(attrs)
        return attrs

    def create(self, validated_data):
        try:
            RefreshToken(validated_data['refresh']).blacklist()
        except TokenError as exc:
            raise serializers.ValidationError({'refresh': str(exc)}) from exc
        return {}

    def _get_refresh_token(self, attrs) -> str:
        request = self.context['request']
        refresh_token = (
            attrs.get('refresh')
            or request.COOKIES.get(settings.JWT_AUTH['REFRESH_COOKIE_NAME'])
            or get_bearer_token(request)
        )

        if not refresh_token:
            raise serializers.ValidationError(
                {'refresh': 'Refresh token is required in body, cookie, or Authorization header.'}
            )

        return refresh_token
