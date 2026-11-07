from django.contrib import admin

from .models import BookIssue, LibraryBook

admin.site.register([LibraryBook, BookIssue])
