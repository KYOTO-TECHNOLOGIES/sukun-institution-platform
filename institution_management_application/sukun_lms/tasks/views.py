from core.viewsets import build_model_viewset

from .models import DailyTask, TaskSubmission
from .serializers import DailyTaskSerializer, TaskSubmissionSerializer


DailyTaskViewSet = build_model_viewset(DailyTask, DailyTaskSerializer, institution_lookup='class_subject__class_obj__institution_id')
TaskSubmissionViewSet = build_model_viewset(TaskSubmission, TaskSubmissionSerializer, institution_lookup='student__institution_id')
