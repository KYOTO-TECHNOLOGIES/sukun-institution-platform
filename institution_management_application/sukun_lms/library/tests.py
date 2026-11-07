from django.utils import timezone
from rest_framework.test import APITestCase
from core.test_helpers import institution, admin
from .models import LibraryBook


class LibraryWorkflowTests(APITestCase):
    def test_stock_and_idempotent_return(self):
        inst=institution(); user=admin(inst); self.client.force_authenticate(user)
        book=LibraryBook.objects.create(institution=inst,book_id='BK1',title='Book',author='Author',category='GENERAL')
        payload={'book':str(book.pk),'borrower':user.pk,'issue_date':str(timezone.localdate()),'due_date':str(timezone.localdate())}
        response=self.client.post('/api/library/book-issues/',payload)
        self.assertEqual(response.status_code,201,response.data)
        book.refresh_from_db(); self.assertEqual(book.available_copies,0)
        self.assertEqual(self.client.post('/api/library/book-issues/',payload).status_code,400)
        url='/api/library/book-issues/'+str(response.data['id'])+'/return/'
        self.assertEqual(self.client.post(url).status_code,200)
        self.assertEqual(self.client.post(url).status_code,200)
        book.refresh_from_db(); self.assertEqual(book.available_copies,1)
