from django.core.exceptions import FieldError, ValidationError as DjangoValidationError
from django.db import transaction
from django.db.models import Q
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
        search=self.request.query_params.get('search','').strip()
        if search and not hasattr(self,'search_fields'):
            expression=Q()
            for field in queryset.model._meta.fields:
                if field.get_internal_type() in {'CharField','TextField','EmailField'} and field.name not in {'password'}:
                    expression |= Q(**{field.name+'__icontains':search})
            queryset=queryset.filter(expression)
        fields = {f.name for f in queryset.model._meta.fields}
        filters = {}
        for param, value in self.request.query_params.items():
            parts = param.split('__')
            if value and parts[0] in fields and (len(parts) == 1 or
                    len(parts) == 2 and parts[1] in {'exact', 'gte', 'lte', 'icontains'}):
                field=queryset.model._meta.get_field(parts[0])
                if field.get_internal_type()=='BooleanField' and value.lower() in {'true','false'}:
                    value=value.lower()=='true'
                filters[param] = value
        try:
            queryset = queryset.filter(**filters)
        except (FieldError, ValueError, DjangoValidationError) as exc:
            raise ValidationError({'filters': 'Invalid filter value.'}) from exc
        return queryset.order_by('-created_at' if 'created_at' in fields else '-pk')

    def validate_write(self, serializer):
        from .validation import validate_domain
        validate_domain(self.queryset.model, serializer.validated_data, serializer.instance)
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
        actor_fields={'marked_by','evaluated_by','completed_by','noted_by','sender','reported_by','issued_by'}
        kwargs={f.name:self.request.user for f in self.queryset.model._meta.fields if f.name in actor_fields}
        instance = serializer.save(**kwargs)
        if not self.request.user.is_superuser and owner_id(instance) != str(self.request.user.institution_id):
            raise ValidationError({'institution': 'Record must belong to your institution.'})

    @transaction.atomic
    def perform_update(self, serializer):
        self.validate_write(serializer)
        actor_fields={'marked_by','evaluated_by','completed_by','noted_by','sender','reported_by','issued_by'}
        kwargs={f.name:self.request.user for f in self.queryset.model._meta.fields if f.name in actor_fields}
        instance = serializer.save(**kwargs)
        if not self.request.user.is_superuser and owner_id(instance) != str(self.request.user.institution_id):
            raise ValidationError({'institution': 'Record must belong to your institution.'})

    def perform_destroy(self, instance):
        # Retain financial, attendance and learning history instead of cascading it away.
        if instance._meta.label_lower in {'institutions.institution', 'students.student', 'staff.teacher'}:
            raise ValidationError('This record has institutional history. Deactivate it instead of deleting it.')
        if instance._meta.label_lower == 'admissions.application' and instance.status == 'ENROLLED':
            raise ValidationError('An enrolled admission application must be retained.')
        from django.db.models.deletion import Collector
        collector = Collector(using=instance._state.db)
        collector.collect([instance])
        protected = {'finance.feepayment', 'finance.feerefund', 'learning.submission',
                     'learning.quizattempt', 'examinations.examresult', 'attendance.studentattendance'}
        if any(model._meta.label_lower in protected and records for model, records in collector.data.items()) or any(
                qs.model._meta.label_lower in protected and qs.exists() for qs in collector.fast_deletes):
            raise ValidationError('This record has historical transactions or learner records. Archive or deactivate it instead.')
        instance.delete()


def build_model_viewset(model, serializer_class, institution_lookup=None):
    attrs = {'queryset': model.objects.all(), 'serializer_class': serializer_class,
             'institution_lookup': institution_lookup}
    return type(f'{model.__name__}ViewSet', (SecureModelViewSet,), attrs)
