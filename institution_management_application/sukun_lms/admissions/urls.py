from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, LeadViewSet, FollowUpViewSet, ApplicationViewSet
router = DefaultRouter()
router.register('campaigns', CampaignViewSet)
router.register('leads', LeadViewSet)
router.register('follow-ups', FollowUpViewSet)
router.register('applications', ApplicationViewSet)
urlpatterns = router.urls
