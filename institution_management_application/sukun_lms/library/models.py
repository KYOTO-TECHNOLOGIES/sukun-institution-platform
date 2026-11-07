from django.conf import settings
from django.db import models

from core.models import BaseModel


class LibraryBook(BaseModel):
    CATEGORY_CHOICES = [
        ('QURAN', 'Quran'),
        ('HADITH', 'Hadith'),
        ('FIQH', 'Fiqh'),
        ('ARABIC', 'Arabic'),
        ('ISLAMIC', 'Islamic Studies'),
        ('LANGUAGE', 'Language'),
        ('GENERAL', 'General'),
        ('REFERENCE', 'Reference'),
    ]

    institution = models.ForeignKey('institutions.Institution', on_delete=models.CASCADE, related_name='library_books')
    book_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=300)
    title_arabic = models.CharField(max_length=300, blank=True, null=True)
    author = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    isbn = models.CharField(max_length=20, blank=True, null=True)
    publisher = models.CharField(max_length=200, blank=True, null=True)
    total_copies = models.IntegerField(default=1)
    available_copies = models.IntegerField(default=1)
    location_shelf = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'library_book'

    def __str__(self):
        return f'{self.title} by {self.author}'


class BookIssue(BaseModel):
    STATUS_CHOICES = [
        ('ISSUED', 'Issued'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'),
        ('LOST', 'Lost'),
    ]

    book = models.ForeignKey(LibraryBook, on_delete=models.CASCADE, related_name='issues')
    borrower = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='borrowed_books')
    issue_date = models.DateField()
    due_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')

    class Meta:
        db_table = 'book_issue'

    def __str__(self):
        return f'{self.book.title} - {self.borrower.get_full_name()}'
