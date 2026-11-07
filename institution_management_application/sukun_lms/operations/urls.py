from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, PayrollViewSet, AssetViewSet, TransportRouteViewSet, TransportAllocationViewSet, HostelRoomViewSet, HostelAllocationViewSet, SupportTicketViewSet, QueueTicketViewSet
router=DefaultRouter()
for prefix,view in [('expenses',ExpenseViewSet),('payroll',PayrollViewSet),('assets',AssetViewSet),
    ('transport-routes',TransportRouteViewSet),('transport-allocations',TransportAllocationViewSet),
    ('hostel-rooms',HostelRoomViewSet),('hostel-allocations',HostelAllocationViewSet),
    ('support-tickets',SupportTicketViewSet),('queue',QueueTicketViewSet)]:
    router.register(prefix,view)
urlpatterns=router.urls
