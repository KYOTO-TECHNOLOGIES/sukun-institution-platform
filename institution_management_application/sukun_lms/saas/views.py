from django.conf import settings
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404, render
from django.utils import timezone
from rest_framework import mixins, viewsets, serializers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from core.permissions import ADMIN_ROLES
from .access import PlatformPermission, access_state, is_platform_admin
from .models import Plan, OrganizationAccount, Invoice, PlatformEvent
from .serializers import (PlanSerializer, OrganizationSerializer, ProvisionSerializer,
    InvoiceSerializer, PlatformEventSerializer, StatusSerializer, SettlementSerializer)


class PlanViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [PlatformPermission]
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    @transaction.atomic
    def perform_create(self, serializer):
        plan = serializer.save()
        PlatformEvent.objects.create(actor=self.request.user, action='plan.created', detail=plan.name)

    @transaction.atomic
    def perform_update(self, serializer):
        plan = Plan.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.instance = plan
        # Changing a shared plan must not strand existing organizations above quota.
        accounts = list(OrganizationAccount.objects.select_for_update().filter(plan=plan).order_by('pk'))
        from .serializers import usage
        for account in accounts:
            used = usage(account)
            if used['users'] > serializer.validated_data.get('user_limit', plan.user_limit) or used['students'] > serializer.validated_data.get('student_limit', plan.student_limit):
                raise ValidationError('These limits are below an organization’s active usage.')
        serializer.save()
        PlatformEvent.objects.create(actor=self.request.user, action='plan.updated', detail=plan.name)


class OrganizationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin,
                          mixins.UpdateModelMixin, viewsets.GenericViewSet):
    permission_classes = [PlatformPermission]
    queryset = OrganizationAccount.objects.select_related('institution', 'plan')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_serializer_class(self):
        return ProvisionSerializer if self.action == 'create' else OrganizationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '')[:200]
        if search:
            qs = qs.filter(Q(institution__name__icontains=search) | Q(billing_email__icontains=search))
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(OrganizationSerializer(serializer.save()).data, status=201)

    @transaction.atomic
    def perform_update(self, serializer):
        # Lock the destination plan before the account, matching shared-plan updates.
        # Re-read it so a concurrent plan edit cannot validate against stale limits.
        if serializer.validated_data.get('plan'):
            serializer.validated_data['plan'] = Plan.objects.select_for_update().get(pk=serializer.validated_data['plan'].pk)
        serializer.instance = OrganizationAccount.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.validate(serializer.validated_data)
        serializer.save()
        PlatformEvent.objects.create(account=serializer.instance, actor=self.request.user,
            action='organization.updated', detail='Updated: '+', '.join(sorted(serializer.validated_data)))

    @action(detail=True, methods=['post'], url_path='change-status')
    @transaction.atomic
    def change_status(self, request, pk=None):
        account = OrganizationAccount.objects.select_for_update().get(pk=self.get_object().pk)
        serializer = StatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        state = serializer.validated_data['status']
        if state == 'TRIAL' and (not account.trial_ends_on or account.trial_ends_on < timezone.localdate()):
            raise ValidationError('Set a future trial end date before starting a trial.')
        previous = account.status
        account.status = state
        account.suspension_reason = serializer.validated_data['reason'] if state in {'SUSPENDED', 'CANCELLED'} else ''
        if state == 'ACTIVE' and not account.institution.is_active:
            account.institution.is_active = True
            account.institution.save(update_fields=['is_active', 'updated_at'])
        account.save()
        PlatformEvent.objects.create(account=account, actor=request.user, action='organization.status_changed',
            detail=f'{previous} → {state}: {serializer.validated_data["reason"]}')
        return Response(OrganizationSerializer(account).data)

    @action(detail=True, methods=['get'])
    def administrators(self, request, pk=None):
        account = self.get_object()
        return Response(list(account.institution.users.filter(user_type='INSTITUTION_ADMIN',is_superuser=False)
            .values('id','first_name','last_name','phone_number','is_active').order_by('id')[:100]))

    @action(detail=True, methods=['post'], url_path='reset-administrator')
    @transaction.atomic
    def reset_administrator(self, request, pk=None):
        from accounts.models import User
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        account = OrganizationAccount.objects.select_for_update().get(pk=self.get_object().pk)
        class ResetSerializer(serializers.Serializer):
            administrator = serializers.IntegerField()
            temporary_password = serializers.CharField(min_length=12, max_length=128, trim_whitespace=False)
            reason = serializers.CharField(min_length=5, max_length=500)
            reactivate = serializers.BooleanField(default=False)
        serializer = ResetSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = get_object_or_404(User.objects.select_for_update(), pk=data['administrator'],
            institution=account.institution, user_type='INSTITUTION_ADMIN', is_superuser=False)
        try: validate_password(data['temporary_password'],user)
        except DjangoValidationError as exc: raise ValidationError({'temporary_password':exc.messages})
        if user.check_password(data['temporary_password']):
            raise ValidationError({'temporary_password':'Choose a different password.'})
        user.set_password(data['temporary_password']); user.must_change_password = True
        if data['reactivate']: user.is_active = True
        user.save()
        for token in OutstandingToken.objects.filter(user=user):
            BlacklistedToken.objects.get_or_create(token=token)
        PlatformEvent.objects.create(account=account, actor=request.user, action='administrator.credentials_reset',
            detail=f'Administrator #{user.pk}; reactivation requested: {data["reactivate"]}. {data["reason"]}')
        return Response({'detail':'Temporary password set. Existing sessions are invalidated; the administrator must change this password at sign-in.'})


class InvoiceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [PlatformPermission]
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.select_related('account__institution')

    def get_queryset(self):
        qs = super().get_queryset()
        account = self.request.query_params.get('account')
        if account:
            from uuid import UUID
            try: account = UUID(account)
            except ValueError: raise ValidationError({'account': 'Invalid organization identifier.'})
            qs = qs.filter(account_id=account)
        status = self.request.query_params.get('status')
        if status: qs = qs.filter(status=status)
        return qs

    @action(detail=True, methods=['post'])
    def settle(self, request, pk=None):
        from .billing import settle
        invoice = self.get_object()
        serializer = SettlementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(InvoiceSerializer(settle(invoice.pk, serializer.validated_data, request.user)).data)

    @action(detail=True, methods=['get'])
    def print(self, request, pk=None):
        return render(request, 'saas/invoice.html', {'invoice': self.get_object()})


class EventViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [PlatformPermission]
    serializer_class = PlatformEventSerializer
    queryset = PlatformEvent.objects.select_related('actor', 'account__institution')


class PlatformOverview(APIView):
    permission_classes = [PlatformPermission]

    def get(self, request):
        accounts = OrganizationAccount.objects.all()
        invoices = Invoice.objects.all()
        # Never add amounts in different currencies to the same revenue total.
        def totals(queryset):
            return list(queryset.values('currency').annotate(amount=Sum('amount')+Sum('tax_amount')).order_by('currency'))
        return Response({'organizations': accounts.count(), 'trials': accounts.filter(status='TRIAL').count(),
            'active': accounts.filter(status='ACTIVE').count(), 'suspended': accounts.filter(status='SUSPENDED').count(),
            'overdue_invoices': invoices.filter(status='ISSUED', due_on__lt=timezone.localdate()).count(),
            'receivables': totals(invoices.filter(status='ISSUED')),
            'collected': totals(invoices.filter(status='PAID')),
            'recent_events': PlatformEventSerializer(PlatformEvent.objects.select_related('actor', 'account__institution')[:8], many=True).data})


def own_account(user):
    if not user.institution_id or user.user_type not in ADMIN_ROLES or is_platform_admin(user):
        raise PermissionDenied('Subscription details are available to institution administrators and principals.')
    return get_object_or_404(OrganizationAccount.objects.select_related('institution', 'plan'), institution_id=user.institution_id)


class SubscriptionView(APIView):
    def get(self, request):
        account = own_account(request.user)
        data = OrganizationSerializer(account).data
        data.pop('operator_notes', None)
        data['plan_details'] = PlanSerializer(account.plan).data if account.plan else None
        data['support_email'] = settings.BILLING_SUPPORT_EMAIL
        data['invoices'] = InvoiceSerializer(account.invoices.all()[:50], many=True).data
        data['invoice_count'] = account.invoices.count()
        return Response(data)

    def patch(self, request):
        account = own_account(request.user)
        if not access_state(account)['allowed']:
            raise PermissionDenied('Restore subscription access before changing assistant settings.')
        if request.user.user_type != 'INSTITUTION_ADMIN':
            raise PermissionDenied('Only the institution administrator can change data-sharing consent.')
        class ConsentSerializer(serializers.Serializer):
            external_ai_enabled = serializers.BooleanField()
        serializer = ConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            account.external_ai_enabled = serializer.validated_data['external_ai_enabled']
            account.save(update_fields=['external_ai_enabled', 'updated_at'])
            PlatformEvent.objects.create(account=account, actor=request.user, action='assistant.consent_changed',
                detail='External AI '+('enabled' if account.external_ai_enabled else 'disabled'))
        return Response({'external_ai_enabled': account.external_ai_enabled})


class OwnInvoiceView(APIView):
    def get(self, request, pk):
        account = own_account(request.user)
        invoice = get_object_or_404(Invoice, account=account, pk=pk)
        return render(request, 'saas/invoice.html', {'invoice': invoice})


class OwnInvoiceList(ListAPIView):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(account=own_account(self.request.user)).select_related('account__institution')
