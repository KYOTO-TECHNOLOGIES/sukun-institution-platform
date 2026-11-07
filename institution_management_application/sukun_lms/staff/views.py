from django.db import transaction
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from core.viewsets import SecureModelViewSet
from core.permissions import InstitutionRolePermission, ADMIN_ROLES, can_access
from .models import StaffLeaveRecord, StaffNote, Teacher
from .serializers import StaffLeaveRecordSerializer, StaffNoteSerializer, TeacherSerializer


class TeacherViewSet(SecureModelViewSet):
    queryset=Teacher.objects.select_related('user'); serializer_class=TeacherSerializer
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(user=self.request.user)
        return qs


class LeavePermission(InstitutionRolePermission):
    def has_permission(self,request,view):
        if request.user.is_authenticated and request.user.user_type=='TEACHER' and view.action in {'create','cancel','list','retrieve'}:
            return bool(request.user.institution_id)
        return super().has_permission(request,view)


class StaffLeaveRecordViewSet(SecureModelViewSet):
    queryset=StaffLeaveRecord.objects.select_related('teacher__user'); serializer_class=StaffLeaveRecordSerializer
    permission_classes=[LeavePermission]
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(teacher__user=self.request.user)
        return qs
    def validate_write(self,serializer):
        super().validate_write(serializer)
        teacher=serializer.validated_data.get('teacher',getattr(serializer.instance,'teacher',None))
        if self.request.user.user_type=='TEACHER' and teacher.user_id!=self.request.user.pk:
            raise PermissionDenied('Request leave only for your own profile.')
        if serializer.instance and serializer.instance.status!='PENDING':
            raise ValidationError('Only pending leave requests can be changed.')
    @action(detail=True,methods=['post'])
    @transaction.atomic
    def review(self,request,pk=None):
        if not can_access(request.user,'staff',True): raise PermissionDenied()
        leave=self.get_queryset().select_for_update().get(pk=self.get_object().pk)
        if leave.teacher.user_id==request.user.pk: raise PermissionDenied('You cannot approve your own leave.')
        status=request.data.get('status')
        if leave.status!='PENDING' or status not in {'APPROVED','REJECTED'}: raise ValidationError('Invalid leave decision.')
        leave.status=status; leave.approved_by=request.user; leave.remarks=request.data.get('remarks',''); leave.save()
        return Response(self.get_serializer(leave).data)
    @action(detail=True,methods=['post'])
    def cancel(self,request,pk=None):
        leave=self.get_object()
        if leave.status!='PENDING': raise ValidationError('Only pending requests can be cancelled.')
        leave.status='CANCELLED'; leave.save()
        return Response(self.get_serializer(leave).data)
    def perform_destroy(self,instance):
        raise ValidationError('Cancel a pending request instead of deleting leave history.')


class StaffNoteViewSet(SecureModelViewSet):
    queryset=StaffNote.objects.all(); serializer_class=StaffNoteSerializer
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(teacher__user=self.request.user,is_private=False)
        return qs
