from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from institutions.models import Institution
from .models import User
from .utils import normalize_phone_number


class InstitutionRegistrationSerializer(serializers.ModelSerializer):
    admin_phone = serializers.CharField()
    admin_password = serializers.CharField(write_only=True, trim_whitespace=False)
    admin_first_name = serializers.CharField(default='Admin')
    admin_last_name = serializers.CharField(default='', allow_blank=True)

    class Meta:
        model = Institution
        fields = ('name', 'registration_number', 'phone', 'email', 'address', 'city',
                  'district', 'state', 'pincode', 'established_year', 'institution_type',
                  'admin_phone', 'admin_password', 'admin_first_name', 'admin_last_name')

    def validate_admin_phone(self, value):
        try:
            value = normalize_phone_number(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError('An account already exists with this phone number.')
        return value

    def validate(self, attrs):
        user = User(phone_number=attrs['admin_phone'], email=attrs['email'],
                    first_name=attrs['admin_first_name'], last_name=attrs['admin_last_name'])
        try:
            validate_password(attrs['admin_password'], user=user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'admin_password': exc.messages})
        if User.objects.filter(email__iexact=attrs['email']).exists():
            raise serializers.ValidationError({'email': 'An account already uses this email.'})
        return attrs

    @transaction.atomic
    def create(self, data):
        admin = {key.removeprefix('admin_'): data.pop(key) for key in list(data) if key.startswith('admin_')}
        institution = Institution.objects.create(**data)
        User.objects.create_user(phone_number=admin.pop('phone'), institution=institution,
                                 email=institution.email, user_type='INSTITUTION_ADMIN', **admin)
        return institution
