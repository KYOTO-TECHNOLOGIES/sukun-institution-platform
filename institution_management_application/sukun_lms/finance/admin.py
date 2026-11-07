from django.contrib import admin

from .models import FeePayment, FeeStructure, StudentFee

admin.site.register([FeeStructure, StudentFee, FeePayment])
