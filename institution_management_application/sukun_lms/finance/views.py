from core.viewsets import build_model_viewset

from .models import FeePayment, FeeStructure, StudentFee
from .serializers import FeePaymentSerializer, FeeStructureSerializer, StudentFeeSerializer


FeeStructureViewSet = build_model_viewset(FeeStructure, FeeStructureSerializer, institution_lookup='institution_id')
StudentFeeViewSet = build_model_viewset(StudentFee, StudentFeeSerializer, institution_lookup='student__institution_id')
FeePaymentViewSet = build_model_viewset(FeePayment, FeePaymentSerializer, institution_lookup='student_fee__student__institution_id')
