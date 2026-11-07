from core.viewsets import SecureModelViewSet
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import DailyTask, TaskSubmission
from .serializers import DailyTaskSerializer, TaskSubmissionSerializer


class DailyTaskViewSet(SecureModelViewSet):
    queryset=DailyTask.objects.all(); serializer_class=DailyTaskSerializer
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(teacher=self.request.user)
        return qs
    def validate_write(self,serializer):
        super().validate_write(serializer)
        teacher=serializer.validated_data.get('teacher',getattr(serializer.instance,'teacher',None))
        if self.request.user.user_type=='TEACHER' and teacher!=self.request.user:
            raise PermissionDenied('Teachers can assign only their own tasks.')
        if serializer.validated_data.get('max_marks',100)<=0: raise ValidationError({'max_marks':'Maximum marks must be positive.'})


class TaskSubmissionViewSet(SecureModelViewSet):
    queryset=TaskSubmission.objects.select_related('student__user','task'); serializer_class=TaskSubmissionSerializer
    http_method_names=['get','patch','head','options']
    def get_queryset(self):
        qs=super().get_queryset()
        if self.request.user.user_type=='TEACHER': qs=qs.filter(task__teacher=self.request.user)
        return qs
    def perform_update(self,serializer):
        self.validate_write(serializer)
        marks=serializer.validated_data.get('marks_obtained',serializer.instance.marks_obtained)
        if marks is not None and not 0<=marks<=serializer.instance.task.max_marks:
            raise ValidationError({'marks_obtained':'Marks must be within the task maximum.'})
        serializer.save(status='EVALUATED' if marks is not None else serializer.instance.status)
