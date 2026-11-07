from rest_framework.routers import DefaultRouter

from .views import AcademicYearViewSet, AuthorityViewSet, InstitutionViewSet

router = DefaultRouter()
router.register('institutions', InstitutionViewSet, basename='institution')
router.register('academic-years', AcademicYearViewSet, basename='academic-year')
router.register('authorities', AuthorityViewSet, basename='authority')

urlpatterns = router.urls
