from rest_framework import serializers

from core.serializers import build_model_serializer
from .models import StaffLeaveRecord, StaffNote, Teacher


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)

    class Meta:
        model = Teacher
        fields = '__all__'


class StaffLeaveRecordSerializer(serializers.ModelSerializer):
    teacher_name=serializers.CharField(source='teacher.user.full_name',read_only=True)
    class Meta:
        model=StaffLeaveRecord; fields='__all__'; read_only_fields=('status','approved_by','days_count')
    def validate(self,attrs):
        start=attrs.get('from_date',getattr(self.instance,'from_date',None))
        end=attrs.get('to_date',getattr(self.instance,'to_date',None))
        if start and end:
            if end<start: raise serializers.ValidationError({'to_date':'End date must follow the start date.'})
            attrs['days_count']=(end-start).days+1
            teacher=attrs.get('teacher',getattr(self.instance,'teacher',None))
            if StaffLeaveRecord.objects.filter(teacher=teacher,status__in=['PENDING','APPROVED'],from_date__lte=end,to_date__gte=start).exclude(pk=getattr(self.instance,'pk',None)).exists():
                raise serializers.ValidationError('This request overlaps an existing leave request.')
        return attrs

StaffNoteSerializer = build_model_serializer(StaffNote)
