from core.serializers import build_model_serializer

from .models import DailyTask, TaskSubmission


DailyTaskSerializer = build_model_serializer(DailyTask)
TaskSubmissionSerializer = build_model_serializer(TaskSubmission)
TaskSubmissionSerializer.Meta.read_only_fields = ('task','student','submission_date','submission_text','submission_file','status')
