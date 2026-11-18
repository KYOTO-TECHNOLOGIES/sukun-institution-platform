"""Payment-provider adapter boundary. Only a trusted server can attest a full payment."""
import hashlib
import hmac
import time
from decimal import Decimal
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from .billing import settle
from .models import Invoice
from .serializers import SettlementSerializer


class BillingWebhookThrottle(AnonRateThrottle):
    scope = 'billing_webhook'


class BillingWebhook(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [BillingWebhookThrottle]

    def post(self, request):
        secret = settings.BILLING_WEBHOOK_SECRET
        if len(secret) < 32:
            return Response({'detail':'Billing integration is not configured.'}, status=503)
        timestamp = request.headers.get('X-Sukun-Timestamp','')
        signature = request.headers.get('X-Sukun-Signature','')
        raw = request.body
        if len(raw) > 8192:
            raise ValidationError('Billing events are limited to 8 KB.')
        try:
            fresh = abs(time.time()-int(timestamp)) <= 300
        except (ValueError, OverflowError):
            fresh = False
        signed = timestamp.encode()+b'.'+raw
        expected = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        if not fresh or not hmac.compare_digest(signature, expected):
            raise AuthenticationFailed('Invalid billing event signature or timestamp.')
        class EventSerializer(SettlementSerializer):
            invoice = serializers.UUIDField()
            amount = serializers.DecimalField(max_digits=13, decimal_places=2, min_value=Decimal('0.01'))
            currency = serializers.ChoiceField(choices=['INR','USD','AED','GBP','EUR'])
        serializer = EventSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        invoice = get_object_or_404(Invoice, pk=data.pop('invoice'))
        if data.pop('amount') != invoice.total or data.pop('currency') != invoice.currency:
            raise ValidationError('Payment amount and currency must match the issued invoice exactly.')
        if data['outcome'] == 'VOID':
            raise ValidationError('Invoice cancellation requires a software administrator.')
        result = settle(invoice.pk, data, actor=None)
        return Response({'invoice':str(result.pk),'status':result.status,'event_id':str(data['event_id'])})
