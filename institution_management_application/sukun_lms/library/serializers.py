from rest_framework import serializers
from .models import LibraryBook, BookIssue


class LibraryBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryBook
        fields = '__all__'
        read_only_fields = ('available_copies',)
    def validate_total_copies(self,value):
        if value < 0: raise serializers.ValidationError('Copies cannot be negative.')
        if self.instance and value < self.instance.issues.filter(status__in=['ISSUED','OVERDUE','LOST']).count():
            raise serializers.ValidationError('Copies cannot be fewer than outstanding loans.')
        return value


class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title',read_only=True)
    borrower_name = serializers.CharField(source='borrower.full_name',read_only=True)
    class Meta:
        model = BookIssue
        fields = '__all__'
        read_only_fields = ('status','return_date','fine_amount')
    def validate(self,attrs):
        if attrs.get('due_date') and attrs['due_date'] < attrs.get('issue_date'):
            raise serializers.ValidationError({'due_date':'Return due date must not precede the issue date.'})
        return attrs
