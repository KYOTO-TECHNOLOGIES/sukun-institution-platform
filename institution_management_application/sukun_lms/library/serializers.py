from core.serializers import build_model_serializer

from .models import BookIssue, LibraryBook


LibraryBookSerializer = build_model_serializer(LibraryBook)
BookIssueSerializer = build_model_serializer(BookIssue)
