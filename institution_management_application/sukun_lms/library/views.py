from core.viewsets import build_model_viewset

from .models import BookIssue, LibraryBook
from .serializers import BookIssueSerializer, LibraryBookSerializer


LibraryBookViewSet = build_model_viewset(LibraryBook, LibraryBookSerializer, institution_lookup='institution_id')
BookIssueViewSet = build_model_viewset(BookIssue, BookIssueSerializer, institution_lookup='book__institution_id')
