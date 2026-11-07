from rest_framework.routers import DefaultRouter

from .views import BookIssueViewSet, LibraryBookViewSet

router = DefaultRouter()
router.register('library-books', LibraryBookViewSet, basename='library-book')
router.register('book-issues', BookIssueViewSet, basename='book-issue')

urlpatterns = router.urls
