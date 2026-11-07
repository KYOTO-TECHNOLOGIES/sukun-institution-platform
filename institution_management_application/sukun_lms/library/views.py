from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from admissions.views import SearchViewSet
from .models import LibraryBook, BookIssue
from .serializers import LibraryBookSerializer, BookIssueSerializer


class LibraryBookViewSet(SearchViewSet):
    queryset = LibraryBook.objects.all()
    serializer_class = LibraryBookSerializer
    search_fields = ('title','author','isbn','book_id')
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        serializer.save(available_copies=serializer.validated_data.get('total_copies',1))
    @transaction.atomic
    def perform_update(self,serializer):
        self.validate_write(serializer)
        book=LibraryBook.objects.select_for_update().get(pk=serializer.instance.pk)
        serializer.instance=book
        total=serializer.validated_data.get('total_copies',book.total_copies)
        outstanding=book.issues.filter(status__in=['ISSUED','OVERDUE','LOST']).count()
        if total < outstanding: raise ValidationError('Copies cannot be fewer than outstanding loans.')
        serializer.save(available_copies=total-outstanding)
    def perform_destroy(self,instance):
        if instance.issues.exists(): raise ValidationError('Books with loan history must be deactivated instead of deleted.')
        super().perform_destroy(instance)


class BookIssueViewSet(SearchViewSet):
    queryset = BookIssue.objects.select_related('book','borrower')
    serializer_class = BookIssueSerializer
    search_fields = ('book__title','borrower__first_name')
    http_method_names = ['get','post','head','options']
    @transaction.atomic
    def perform_create(self,serializer):
        self.validate_write(serializer)
        book=LibraryBook.objects.select_for_update().get(pk=serializer.validated_data['book'].pk)
        if book.available_copies < 1: raise ValidationError({'book':'No copies are available.'})
        if book.issues.filter(borrower=serializer.validated_data['borrower'],status__in=['ISSUED','OVERDUE']).exists():
            raise ValidationError({'borrower':'This borrower already has an outstanding copy.'})
        serializer.save(book=book)
        book.available_copies-=1
        book.save(update_fields=['available_copies','updated_at'])

    @action(detail=True,methods=['post'],url_path='return')
    @transaction.atomic
    def return_book(self,request,pk=None):
        issue=self.get_object()
        book=LibraryBook.objects.select_for_update().get(pk=issue.book_id)
        issue=BookIssue.objects.select_for_update().get(pk=issue.pk)
        if issue.status != 'RETURNED':
            issue.status='RETURNED'; issue.return_date=timezone.localdate()
            issue.save(update_fields=['status','return_date','updated_at'])
            book.available_copies+=1; book.save(update_fields=['available_copies','updated_at'])
        return Response(self.get_serializer(issue).data)
