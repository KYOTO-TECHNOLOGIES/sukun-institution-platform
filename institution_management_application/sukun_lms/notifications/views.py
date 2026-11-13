from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework.pagination import PageNumberPagination
from core.permissions import can_access
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet
from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from .catalog import MODULE_LABELS
from .models import InboxItem, NotificationPreference
from .policy import visible_inbox
from .services import publish_changed

class InboxSerializer(serializers.ModelSerializer):
    module_label = serializers.SerializerMethodField()
    def get_module_label(self, obj):
        return MODULE_LABELS.get(obj.module, obj.module)
    class Meta:
        model = InboxItem
        fields = ['id','module','module_label','title','message','href','attention','created_at','read_at']

class PreferenceSerializer(serializers.ModelSerializer):
    muted_modules = serializers.ListField(child=serializers.ChoiceField(choices=list(MODULE_LABELS)), max_length=len(MODULE_LABELS))
    class Meta:
        model = NotificationPreference
        fields = ['toasts_enabled', 'muted_modules']

class InboxPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class InboxViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    pagination_class = InboxPagination
    permission_classes = [IsAuthenticated]
    serializer_class = InboxSerializer
    def get_queryset(self):
        qs = visible_inbox(self.request.user)
        if self.request.query_params.get('unread') == 'true':
            qs = qs.filter(read_at__isnull=True)
        module = self.request.query_params.get('module')
        if module:
            qs = qs.filter(module=module)
        ids = self.request.query_params.get('ids')
        if ids:
            import uuid
            try:
                parsed = [uuid.UUID(value) for value in ids.split(',')[:100]]
            except ValueError:
                raise serializers.ValidationError({'ids': 'Use valid notification IDs.'})
            qs = qs.filter(id__in=parsed)
        return qs
    @action(detail=False, methods=['get'])
    def summary(self, request):
        preference, _ = NotificationPreference.objects.get_or_create(user=request.user)
        available = set(visible_inbox(request.user).values_list('module', flat=True))
        if request.user.user_type in {'STUDENT','PARENT'}:
            available.update(['students','attendance','learning','tasks','finance','examinations','communications'])
        available.update(key for key in MODULE_LABELS if can_access(request.user, key))
        return Response({
            'unread_count': visible_inbox(request.user).filter(read_at__isnull=True).count(),
            'preferences': PreferenceSerializer(preference).data,
            'modules': [{'key': key, 'label': label} for key, label in MODULE_LABELS.items() if key in available],
        })
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        item = self.get_object()
        if item.read_at is None:
            InboxItem.objects.filter(pk=item.pk, read_at__isnull=True).update(read_at=timezone.now())
            transaction.on_commit(lambda: publish_changed(request.user.institution_id, request.user.pk, reason='read'))
        return Response({'status': 'read'})
    @action(detail=False, methods=['post'], url_path='read-all')
    def read_all(self, request):
        count = visible_inbox(request.user).filter(read_at__isnull=True).update(read_at=timezone.now())
        if count:
            transaction.on_commit(lambda: publish_changed(request.user.institution_id, request.user.pk, reason='read'))
        return Response({'updated': count})
    @action(detail=False, methods=['patch'])
    def preferences(self, request):
        preference, _ = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = PreferenceSerializer(preference, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        transaction.on_commit(lambda: publish_changed(request.user.institution_id, request.user.pk, reason='preferences'))
        return Response(serializer.data)
