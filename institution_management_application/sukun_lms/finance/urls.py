from rest_framework.routers import DefaultRouter

from .views import FeeRefundViewSet, FeePaymentViewSet, FeeStructureViewSet, StudentFeeViewSet

router = DefaultRouter()
router.register('fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register('student-fees', StudentFeeViewSet, basename='student-fee')
router.register('fee-payments', FeePaymentViewSet, basename='fee-payment')

router.register('refunds', FeeRefundViewSet, basename='fee-refund')
urlpatterns = router.urls
