from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (PlanViewSet, OrganizationViewSet, InvoiceViewSet, EventViewSet,
    PlatformOverview, SubscriptionView, OwnInvoiceView)
from .hierarchy import HierarchyView, SetupView

router = DefaultRouter()
router.register('plans', PlanViewSet)
router.register('organizations', OrganizationViewSet)
router.register('invoices', InvoiceViewSet)
router.register('events', EventViewSet)

urlpatterns = [
    path('hierarchy/', HierarchyView.as_view()),
    path('setup/', SetupView.as_view()),
    path('platform/overview/', PlatformOverview.as_view()),
    path('platform/', include(router.urls)),
    path('subscription/', SubscriptionView.as_view()),
    path('my-invoices/<uuid:pk>/print/', OwnInvoiceView.as_view()),
]
