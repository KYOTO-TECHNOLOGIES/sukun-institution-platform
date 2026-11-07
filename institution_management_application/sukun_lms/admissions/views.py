import uuid
from django.db import transaction, IntegrityError
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework import serializers
from core.viewsets import SecureModelViewSet
from core.permissions import ADMIN_ROLES
from accounts.models import User
from students.models import Student, ParentGuardian
from academics.models import Division
from accounts.utils import normalize_phone_number
from .models import Campaign, Lead, FollowUp, Application
from .serializers import CampaignSerializer, LeadSerializer, FollowUpSerializer, ApplicationSerializer


class SearchViewSet(SecureModelViewSet):
    search_fields = ()
    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '').strip()
        if search:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{field + '__icontains': search})
            qs = qs.filter(query)
        return qs


class CampaignViewSet(SearchViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    search_fields = ('name', 'channel')


class LeadViewSet(SearchViewSet):
    queryset = Lead.objects.select_related('campaign', 'assigned_to')
    serializer_class = LeadSerializer
    search_fields = ('full_name', 'phone', 'email', 'source')


class FollowUpViewSet(SearchViewSet):
    queryset = FollowUp.objects.select_related('lead')
    serializer_class = FollowUpSerializer
    search_fields = ('lead__full_name', 'notes')

    def perform_create(self, serializer):
        self.validate_write(serializer)
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        followup = self.get_object()
        followup.completed_at = timezone.now()
        followup.save(update_fields=['completed_at', 'updated_at'])
        return Response(self.get_serializer(followup).data)


class ApplicationViewSet(SearchViewSet):
    queryset = Application.objects.select_related('division__class_obj', 'student')
    serializer_class = ApplicationSerializer
    search_fields = ('first_name', 'last_name', 'phone')

    def require_admissions_role(self):
        user = self.request.user
        if not (user.is_superuser or user.user_type in ADMIN_ROLES | {'ADMISSIONS'}):
            raise PermissionDenied('Admission approval and enrollment require admissions staff or an administrator.')

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def review(self, request, pk=None):
        self.require_admissions_role()
        application = self.get_queryset().select_for_update(of=('self',)).get(pk=self.get_object().pk)
        target = request.data.get('status')
        allowed = {'SUBMITTED': {'UNDER_REVIEW', 'APPROVED', 'REJECTED'},
                   'UNDER_REVIEW': {'APPROVED', 'REJECTED'}, 'REJECTED': {'UNDER_REVIEW'},
                   'APPROVED': {'UNDER_REVIEW'}}
        if target not in allowed.get(application.status, set()):
            raise ValidationError({'status': 'This status transition is not allowed.'})
        if target == 'APPROVED' and not application.documents_verified:
            raise ValidationError({'documents_verified': 'Verify the admission documents before approval.'})
        if target == 'REJECTED' and not request.data.get('reason', '').strip():
            raise ValidationError({'reason': 'A rejection reason is required.'})
        application.status = target
        application.reviewed_by = request.user
        application.rejection_reason = request.data.get('reason', '') if target == 'REJECTED' else ''
        application.save()
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def enroll(self, request, pk=None):
        self.require_admissions_role()
        application = self.get_queryset().select_for_update(of=('self',)).get(pk=self.get_object().pk)
        if application.status == 'ENROLLED':
            return Response(self.get_serializer(application).data)
        if application.status != 'APPROVED':
            raise ValidationError({'status': 'Approve the application before enrollment.'})
        division = Division.objects.select_for_update().get(pk=application.division_id)
        if Student.objects.filter(division=division, academic_year=application.academic_year, is_active=True).count() >= division.capacity:
            raise ValidationError({'division': 'The selected class division is at capacity.'})
        password = request.data.get('initial_password', '')
        try:
            validate_password(password, user=User(first_name=application.first_name, phone_number=application.phone))
        except DjangoValidationError as exc:
            raise ValidationError({'initial_password': exc.messages})
        if User.objects.filter(phone_number=application.phone).exists():
            raise ValidationError({'phone': 'This phone already has an account. Use a unique student login phone.'})
        if application.email and User.objects.filter(email__iexact=application.email).exists():
            raise ValidationError({'email': 'This email already has an account.'})
        try:
            with transaction.atomic():
                user = User.objects.create_user(phone_number=application.phone, password=password,
                    first_name=application.first_name, last_name=application.last_name,
                    email=application.email or None, date_of_birth=application.date_of_birth,
                    address=application.address, institution=application.institution, user_type='STUDENT')
                student = Student.objects.create(user=user, institution=application.institution,
                    admission_number='SK-' + uuid.uuid4().hex[:12].upper(), roll_number=str(division.students.count()+1),
                    admission_date=timezone.localdate(), division=division, academic_year=application.academic_year,
                    gender=application.gender)
                # Guardian login is optional and requires a separate explicit initial password.
                if application.guardian_phone and request.data.get('guardian_password'):
                    phone = normalize_phone_number(application.guardian_phone)
                    if User.objects.filter(phone_number=phone).exists():
                        raise ValidationError({'guardian_phone': 'Guardian account exists; link it through student management.'})
                    validate_password(request.data['guardian_password'])
                    parent = User.objects.create_user(phone_number=phone, password=request.data['guardian_password'],
                        first_name=application.guardian_name or 'Guardian', institution=application.institution, user_type='PARENT')
                    ParentGuardian.objects.create(student=student, user=parent, relation='GUARDIAN')
                application.student = student
                application.status = 'ENROLLED'
                application.save()
                if application.lead_id:
                    application.lead.stage = 'APPLICATION'
                    application.lead.save(update_fields=['stage', 'updated_at'])
        except IntegrityError:
            raise ValidationError('An account or enrollment already exists with these details.')
        except DjangoValidationError as exc:
            raise ValidationError(exc.messages)
        return Response(self.get_serializer(application).data, status=201)
