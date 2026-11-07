from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from admissions.views import SearchViewSet
from core.permissions import ADMIN_ROLES
from institutions.models import Institution
from .models import Expense, Payroll, Asset, TransportRoute, TransportAllocation, HostelRoom, HostelAllocation, SupportTicket, QueueTicket
from .serializers import ExpenseSerializer, PayrollSerializer, AssetSerializer, TransportRouteSerializer, TransportAllocationSerializer, HostelRoomSerializer, HostelAllocationSerializer, SupportTicketSerializer, QueueTicketSerializer


class ApprovalViewSet(SearchViewSet):
    def validate_write(self,serializer):
        super().validate_write(serializer)
        if serializer.instance and serializer.instance.status in {'APPROVED','PAID'}:
            raise ValidationError('Approved financial records are locked. Create a correcting record if needed.')
    def perform_destroy(self,instance):
        if instance.status in {'APPROVED','PAID'}: raise ValidationError('Approved records cannot be deleted.')
        super().perform_destroy(instance)
    @action(detail=True,methods=['post'])
    @transaction.atomic
    def transition(self,request,pk=None):
        item=self.get_queryset().select_for_update().get(pk=self.get_object().pk)
        target=request.data.get('status')
        allowed={'PENDING':{'APPROVED','REJECTED'},'DRAFT':{'APPROVED'},'APPROVED':{'PAID'}}
        if target not in allowed.get(item.status,set()): raise ValidationError('Invalid status transition.')
        if target in {'APPROVED','REJECTED'} and not (request.user.is_superuser or request.user.user_type in ADMIN_ROLES):
            raise PermissionDenied('An administrator must approve financial records.')
        if target=='PAID' and request.user.user_type not in ADMIN_ROLES | {'ACCOUNTANT'} and not request.user.is_superuser:
            raise PermissionDenied('Accounts staff must record this payment.')
        item.status=target
        if isinstance(item,Expense): item.approved_by=request.user
        if isinstance(item,Payroll) and target=='PAID':
            if not request.data.get('reference','').strip(): raise ValidationError({'reference':'A payroll payment reference is required.'})
            item.reference=request.data['reference']; item.paid_at=timezone.now()
        item.save()
        return Response(self.get_serializer(item).data)


class ExpenseViewSet(ApprovalViewSet):
    permission_module='expenses'
    queryset=Expense.objects.all(); serializer_class=ExpenseSerializer; search_fields=('title','vendor','reference')


class PayrollViewSet(ApprovalViewSet):
    permission_module='payroll'
    queryset=Payroll.objects.select_related('employee'); serializer_class=PayrollSerializer; search_fields=('employee__first_name','reference')


class AssetViewSet(SearchViewSet):
    permission_module='assets'
    queryset=Asset.objects.all(); serializer_class=AssetSerializer; search_fields=('name','asset_tag','location')


class TransportRouteViewSet(SearchViewSet):
    permission_module='transport'
    queryset=TransportRoute.objects.all(); serializer_class=TransportRouteSerializer; search_fields=('name','vehicle_number')
    def validate_write(self,serializer):
        super().validate_write(serializer)
        if serializer.instance and serializer.validated_data.get('capacity',serializer.instance.capacity)<serializer.instance.allocations.filter(is_active=True).count():
            raise ValidationError({'capacity':'Capacity cannot be below current allocations.'})


class HostelRoomViewSet(SearchViewSet):
    permission_module='hostel'
    queryset=HostelRoom.objects.all(); serializer_class=HostelRoomSerializer; search_fields=('building','room_number')
    def validate_write(self,serializer):
        super().validate_write(serializer)
        if serializer.instance and serializer.validated_data.get('capacity',serializer.instance.capacity)<serializer.instance.allocations.filter(is_active=True).count():
            raise ValidationError({'capacity':'Capacity cannot be below current allocations.'})


class AllocationViewSet(SearchViewSet):
    def check_capacity(self,serializer):
        data=serializer.validated_data
        key='route' if self.queryset.model==TransportAllocation else 'room'
        target=data.get(key,getattr(serializer.instance,key,None))
        target=type(target).objects.select_for_update().get(pk=target.pk)
        count=target.allocations.filter(is_active=True).exclude(pk=getattr(serializer.instance,'pk',None)).count()
        if data.get('is_active',getattr(serializer.instance,'is_active',True)) and count>=target.capacity:
            raise ValidationError({key:'No places are available.'})
        if key=='room':
            student=data.get('student',getattr(serializer.instance,'student',None))
            if target.gender!=student.gender: raise ValidationError({'room':'Select a room matching the student accommodation category.'})
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer); self.check_capacity(serializer); serializer.save()
    @transaction.atomic
    def perform_update(self,serializer):
        self.validate_write(serializer); self.check_capacity(serializer); serializer.save()


class TransportAllocationViewSet(AllocationViewSet):
    permission_module='transport'
    queryset=TransportAllocation.objects.select_related('student__user','route'); serializer_class=TransportAllocationSerializer; search_fields=('student__user__first_name','route__name')


class HostelAllocationViewSet(AllocationViewSet):
    permission_module='hostel'
    queryset=HostelAllocation.objects.select_related('student__user','room'); serializer_class=HostelAllocationSerializer; search_fields=('student__user__first_name','room__room_number')


class SupportTicketViewSet(SearchViewSet):
    permission_module='support'
    queryset=SupportTicket.objects.all(); serializer_class=SupportTicketSerializer; search_fields=('title','description')
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(created_by=self.request.user)
        return qs
    def perform_create(self,serializer):
        self.validate_write(serializer); serializer.save(created_by=self.request.user)


class QueueTicketViewSet(SearchViewSet):
    permission_module='frontdesk'
    queryset=QueueTicket.objects.all(); serializer_class=QueueTicketSerializer; search_fields=('token','visitor_name','service')
    @action(detail=True,methods=['post'])
    @transaction.atomic
    def transition(self,request,pk=None):
        ticket=self.get_queryset().select_for_update().get(pk=self.get_object().pk)
        target=request.data.get('status')
        allowed={'WAITING':{'CALLED','CANCELLED'},'CALLED':{'SERVING','CANCELLED'},'SERVING':{'COMPLETED','CANCELLED'}}
        if target not in allowed.get(ticket.status,set()): raise ValidationError('Invalid queue transition.')
        ticket.status=target
        if target=='CALLED': ticket.called_at=timezone.now()
        if target in {'COMPLETED','CANCELLED'}: ticket.completed_at=timezone.now()
        ticket.counter=request.data.get('counter',ticket.counter); ticket.save()
        return Response(self.get_serializer(ticket).data)
