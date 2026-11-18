from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from accounts.registration import InstitutionRegistrationSerializer
from .models import Plan, OrganizationAccount, Invoice, PlatformEvent
from .access import access_state


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'


def usage(account):
    from accounts.models import User
    from students.models import Student
    return {
        'users': User.objects.filter(institution=account.institution, is_active=True).count(),
        'students': Student.objects.filter(institution=account.institution, is_active=True).count(),
        'user_limit': account.plan.user_limit if account.plan else None,
        'student_limit': account.plan.student_limit if account.plan else None,
    }


class OrganizationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='institution.name', read_only=True)
    institution_email = serializers.CharField(source='institution.email', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True, default='Legacy / custom')
    access = serializers.SerializerMethodField()
    usage = serializers.SerializerMethodField()

    def get_access(self, obj):
        return access_state(obj)

    def get_usage(self, obj):
        return usage(obj)

    class Meta:
        model = OrganizationAccount
        fields = '__all__'
        read_only_fields = ('id', 'institution', 'status', 'suspension_reason', 'created_at', 'updated_at')

    def validate(self, attrs):
        plan = attrs.get('plan')
        if plan and not plan.is_active:
            raise serializers.ValidationError({'plan': 'Choose an active plan.'})
        if self.instance and 'plan' in attrs and attrs['plan']:
            current = usage(self.instance)
            if current['users'] > plan.user_limit or current['students'] > plan.student_limit:
                raise serializers.ValidationError({'plan': 'This plan is smaller than the current usage. Deactivate unused records or increase its limits first.'})
        if self.instance and self.instance.status == 'TRIAL' and 'trial_ends_on' in attrs and not attrs['trial_ends_on']:
            raise serializers.ValidationError({'trial_ends_on': 'A trial must have an end date.'})
        return attrs


class ProvisionSerializer(InstitutionRegistrationSerializer):
    plan = serializers.PrimaryKeyRelatedField(queryset=Plan.objects.filter(is_active=True))
    trial_days = serializers.IntegerField(default=14, min_value=1, max_value=90)

    class Meta(InstitutionRegistrationSerializer.Meta):
        fields = InstitutionRegistrationSerializer.Meta.fields + ('plan', 'trial_days')

    @transaction.atomic
    def create(self, data):
        from datetime import timedelta
        plan, days = data.pop('plan'), data.pop('trial_days')
        institution = super().create(data)
        institution.users.update(must_change_password=True)
        account = OrganizationAccount.objects.create(institution=institution, plan=plan,
            billing_email=institution.email, trial_ends_on=timezone.localdate()+timedelta(days=days))
        PlatformEvent.objects.create(account=account, actor=self.context['request'].user,
            action='organization.provisioned', detail=f'{days}-day trial; plan: {plan.name}. Administrator must change their temporary password.')
        return account


class InvoiceSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=13, decimal_places=2, read_only=True)
    organization_name = serializers.CharField(source='account.institution.name', read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('id', 'number', 'status', 'issued_on', 'bill_to', 'issuer', 'paid_at', 'payment_reference', 'created_at')

    def validate(self, attrs):
        if attrs['due_on'] < timezone.localdate():
            raise serializers.ValidationError({'due_on': 'The due date cannot be before issue date.'})
        if attrs['service_until'] < attrs['service_from']:
            raise serializers.ValidationError({'service_until': 'End date must be on or after start date.'})
        return attrs

    @transaction.atomic
    def create(self, data):
        account = OrganizationAccount.objects.select_for_update().select_related('institution').get(pk=data['account'].pk)
        inst = account.institution
        # Capture addresses at issue time; later institution edits must not rewrite issued invoices.
        data.update(issued_on=timezone.localdate(), bill_to={'name': inst.name, 'email': account.billing_email,
            'address': ', '.join(filter(None, [inst.address, inst.city, inst.state, inst.pincode])), 'registration': inst.registration_number},
            issuer={'name': settings.BILLING_BUSINESS_NAME, 'address': settings.BILLING_BUSINESS_ADDRESS,
                    'email': settings.BILLING_SUPPORT_EMAIL, 'tax_id': settings.BILLING_TAX_ID})
        invoice = super().create(data)
        PlatformEvent.objects.create(account=account, actor=self.context['request'].user,
            action='invoice.issued', detail=f'{invoice.number}: {invoice.currency} {invoice.total}; due {invoice.due_on}.')
        return invoice


class PlatformEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True, default='System')
    organization_name = serializers.CharField(source='account.institution.name', read_only=True, default='Platform')

    class Meta:
        model = PlatformEvent
        fields = '__all__'


class StatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrganizationAccount.Status.choices)
    reason = serializers.CharField(max_length=500, min_length=5)


class SettlementSerializer(serializers.Serializer):
    event_id = serializers.UUIDField()
    outcome = serializers.ChoiceField(choices=['PAID', 'FAILED', 'VOID'])
    reference = serializers.CharField(max_length=160, min_length=3)
    reason = serializers.CharField(max_length=500, min_length=5)
