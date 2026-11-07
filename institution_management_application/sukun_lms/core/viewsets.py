from django.core.exceptions import FieldError, ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError, PermissionDenied
from .permissions import InstitutionRolePermission
from .tenancy import institution_path, validate_relations, owner_id


class SecureModelViewSet(viewsets.ModelViewSet):
    permission_classes = [InstitutionRolePermission]
    institution_lookup = None

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        lookup = self.institution_lookup or institution_path(queryset.model)
        if not user.is_superuser:
            if not user.institution_id or not lookup:
                return queryset.none()
            queryset = queryset.filter(**{lookup: user.institution_id})
        fields = {f.name for f in queryset.model._meta.fields}
        filters = {}
        for param, value in self.request.query_params.items():
            parts = param.split('__')
            if value and parts[0] in fields and (len(parts) == 1 or
                    len(parts) == 2 and parts[1] in {'exact', 'gte', 'lte', 'icontains'}):
                filters[param] = value
        try:
            queryset = queryset.filter(**filters)
        except (FieldError, ValueError, DjangoValidationError) as exc:
            raise ValidationError({'filters': 'Invalid filter value.'}) from exc
        return queryset.order_by('-created_at' if 'created_at' in fields else '-pk')

    def validate_write(self, serializer):
        user = self.request.user
        if not user.is_superuser:
            validate_relations(serializer.validated_data, user.institution_id)
            if self.queryset.model._meta.label_lower == 'institutions.institution' and not serializer.instance:
                raise PermissionDenied('Use institution registration to create an institution.')
        if self.queryset.model._meta.label_lower == 'accounts.user' and not user.is_superuser:
            data = serializer.validated_data
            if data.get('user_type') == 'SUPER_ADMIN' or data.get('is_staff'):
                raise ValidationError({'user_type': 'Platform administrator privileges cannot be assigned here.'})
            if serializer.instance and serializer.instance.is_superuser:
                raise PermissionDenied('Platform administrators cannot be changed here.')

    @transaction.atomic
    def perform_create(self, serializer):
        self.validate_write(serializer)
        instance = serializer.save()
        if not self.request.user.is_superuser and owner_id(instance) != str(self.request.user.institution_id):
            raise ValidationError({'institution': 'Record must belong to your institution.'})

    @transaction.atomic
    def perform_update(self, serializer):
        self.validate_write(serializer)
        instance = serializer.save()
        if not self.request.user.is_superuser and owner_id(instance) != str(self.request.user.institution_id):
            raise ValidationError({'institution': 'Record must belong to your institution.'})


def build_model_viewset(model, serializer_class, institution_lookup=None):
    attrs = {'queryset': model.objects.all(), 'serializer_class': serializer_class,
             'institution_lookup': institution_lookup}
    return type(f'{model.__name__}ViewSet', (SecureModelViewSet,), attrs)
