from core.viewsets import build_model_viewset

from .models import StaffLeaveRecord, StaffNote, Teacher
from .serializers import StaffLeaveRecordSerializer, StaffNoteSerializer, TeacherSerializer


TeacherViewSet = build_model_viewset(Teacher, TeacherSerializer, institution_lookup='institution_id')
StaffLeaveRecordViewSet = build_model_viewset(StaffLeaveRecord, StaffLeaveRecordSerializer, institution_lookup='teacher__institution_id')
StaffNoteViewSet = build_model_viewset(StaffNote, StaffNoteSerializer, institution_lookup='teacher__institution_id')
