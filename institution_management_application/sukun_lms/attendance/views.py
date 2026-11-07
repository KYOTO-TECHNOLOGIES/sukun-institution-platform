from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from core.viewsets import SecureModelViewSet
from .models import StudentAttendance, TeacherAttendance
from .serializers import StudentAttendanceSerializer, TeacherAttendanceSerializer


class StudentAttendanceViewSet(SecureModelViewSet):
    queryset=StudentAttendance.objects.select_related('student__user','division')
    serializer_class=StudentAttendanceSerializer

    @action(detail=False,methods=['post'])
    @transaction.atomic
    def bulk(self,request):
        from academics.models import Division
        from students.models import Student
        class Row(serializers.Serializer):
            student=serializers.UUIDField()
            status=serializers.ChoiceField(choices=StudentAttendance.STATUS_CHOICES)
            remarks=serializers.CharField(required=False,allow_blank=True,max_length=1000)
        class Batch(serializers.Serializer):
            division=serializers.UUIDField()
            date=serializers.DateField()
            records=Row(many=True)
        batch=Batch(data=request.data); batch.is_valid(raise_exception=True); data=batch.validated_data
        division=get_object_or_404(Division,pk=data['division'],class_obj__institution=request.user.institution)
        rows=data['records']
        if not rows or len(rows)>500: raise ValidationError('Submit between 1 and 500 attendance records.')
        ids=[row['student'] for row in rows]
        if len(ids)!=len(set(ids)): raise ValidationError('A student may appear only once.')
        students={s.pk:s for s in Student.objects.filter(pk__in=ids,division=division,institution=request.user.institution,is_active=True)}
        if len(students)!=len(ids): raise ValidationError('Every student must belong to this division.')
        for row in rows:
            StudentAttendance.objects.update_or_create(student=students[row['student']],date=data['date'],
                defaults={'division':division,'status':row['status'],'remarks':row.get('remarks',''),'marked_by':request.user})
        return Response({'saved':len(rows)})


class TeacherAttendanceViewSet(SecureModelViewSet):
    queryset=TeacherAttendance.objects.select_related('teacher__user')
    serializer_class=TeacherAttendanceSerializer
    permission_module='staff'
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(teacher__user=self.request.user)
        return qs
