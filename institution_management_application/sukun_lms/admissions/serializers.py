from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from accounts.utils import normalize_phone_number
from .models import Campaign, Lead, FollowUp, Application


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = '__all__'

    def validate(self, attrs):
        start = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date must follow the start date.'})
        return attrs


class LeadSerializer(serializers.ModelSerializer):
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)
    assigned_name = serializers.CharField(source='assigned_to.full_name', read_only=True)

    class Meta:
        model = Lead
        fields = '__all__'

    def validate(self, attrs):
        stage = attrs.get('stage', getattr(self.instance, 'stage', 'NEW'))
        if stage == 'LOST' and not attrs.get('lost_reason', getattr(self.instance, 'lost_reason', '')):
            raise serializers.ValidationError({'lost_reason': 'Record why this enquiry was lost.'})
        return attrs


class FollowUpSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.full_name', read_only=True)
    class Meta:
        model = FollowUp
        fields = '__all__'
        read_only_fields = ('created_by', 'completed_at')


class ApplicationSerializer(serializers.ModelSerializer):
    division_name = serializers.CharField(source='division.__str__', read_only=True)
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('status', 'student', 'reviewed_by', 'rejection_reason')

    def validate_phone(self, value):
        try:
            return normalize_phone_number(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)

    def validate(self, attrs):
        if self.instance and self.instance.status == 'ENROLLED':
            raise serializers.ValidationError('An enrolled application is locked.')
        return attrs
