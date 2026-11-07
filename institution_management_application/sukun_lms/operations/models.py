from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from core.models import BaseModel


class Expense(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30,choices=[(x,x.title()) for x in ['UTILITIES','SUPPLIES','MAINTENANCE','MARKETING','SALARIES','OTHER']])
    amount = models.DecimalField(max_digits=12,decimal_places=2,validators=[MinValueValidator(Decimal('0.01'))])
    date = models.DateField()
    vendor = models.CharField(max_length=200,blank=True)
    reference = models.CharField(max_length=100,blank=True)
    status = models.CharField(max_length=20,default='PENDING',choices=[(x,x.title()) for x in ['PENDING','APPROVED','PAID','REJECTED']])
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True)


class Payroll(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    employee = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.PROTECT)
    month = models.DateField(help_text='First day of the salary month')
    basic = models.DecimalField(max_digits=12,decimal_places=2,validators=[MinValueValidator(0)])
    allowances = models.DecimalField(max_digits=12,decimal_places=2,default=0,validators=[MinValueValidator(0)])
    deductions = models.DecimalField(max_digits=12,decimal_places=2,default=0,validators=[MinValueValidator(0)])
    status = models.CharField(max_length=20,default='DRAFT',choices=[(x,x.title()) for x in ['DRAFT','APPROVED','PAID']])
    paid_at = models.DateTimeField(null=True,blank=True)
    reference = models.CharField(max_length=100,blank=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['employee','month'],name='unique_employee_salary_month')]


class Asset(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    asset_tag = models.CharField(max_length=80)
    category = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=1)
    location = models.CharField(max_length=200)
    condition = models.CharField(max_length=20,default='GOOD',choices=[(x,x.title()) for x in ['GOOD','REPAIR','RETIRED']])
    purchase_date = models.DateField(null=True,blank=True)
    purchase_cost = models.DecimalField(max_digits=12,decimal_places=2,default=0,validators=[MinValueValidator(0)])
    notes = models.TextField(blank=True)
    class Meta:
        constraints=[models.UniqueConstraint(fields=['institution','asset_tag'],name='unique_institution_asset_tag')]


class TransportRoute(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    vehicle_number = models.CharField(max_length=40)
    driver_name = models.CharField(max_length=150)
    driver_phone = models.CharField(max_length=20)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    stops = models.TextField(help_text='One stop per line')
    def __str__(self): return self.name


class TransportAllocation(BaseModel):
    route = models.ForeignKey(TransportRoute,on_delete=models.PROTECT,related_name='allocations')
    student = models.OneToOneField('students.Student',on_delete=models.CASCADE,related_name='transport_allocation')
    pickup_stop = models.CharField(max_length=200)
    monthly_fee = models.DecimalField(max_digits=10,decimal_places=2,default=0,validators=[MinValueValidator(0)])


class HostelRoom(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    building = models.CharField(max_length=100)
    room_number = models.CharField(max_length=30)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    gender = models.CharField(max_length=6,choices=[('MALE','Male'),('FEMALE','Female')])
    def __str__(self): return self.building+' / '+self.room_number
    class Meta:
        constraints=[models.UniqueConstraint(fields=['institution','building','room_number'],name='unique_hostel_room')]


class HostelAllocation(BaseModel):
    room = models.ForeignKey(HostelRoom,on_delete=models.PROTECT,related_name='allocations')
    student = models.OneToOneField('students.Student',on_delete=models.CASCADE,related_name='hostel_allocation')
    check_in = models.DateField()
    monthly_fee = models.DecimalField(max_digits=10,decimal_places=2,default=0,validators=[MinValueValidator(0)])
    emergency_contact = models.CharField(max_length=150,blank=True)


class SupportTicket(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=30,default='GENERAL',choices=[(x,x.title()) for x in ['GENERAL','IT','MAINTENANCE','ACADEMIC','FEES']])
    description = models.TextField()
    priority = models.CharField(max_length=20,default='NORMAL',choices=[('NORMAL','Normal'),('HIGH','High'),('URGENT','Urgent')])
    status = models.CharField(max_length=20,default='OPEN',choices=[(x,x.title()) for x in ['OPEN','IN_PROGRESS','RESOLVED','CLOSED']])
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True)
    resolution = models.TextField(blank=True)


class QueueTicket(BaseModel):
    institution = models.ForeignKey('institutions.Institution',on_delete=models.CASCADE)
    token = models.CharField(max_length=20,unique=True,editable=False)
    visitor_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20,blank=True)
    service = models.CharField(max_length=30,choices=[(x,x.title()) for x in ['ADMISSIONS','ACCOUNTS','PRINCIPAL','GENERAL']])
    priority = models.CharField(max_length=10,default='NORMAL',choices=[('NORMAL','Normal'),('HIGH','High')])
    status = models.CharField(max_length=20,default='WAITING',choices=[(x,x.title()) for x in ['WAITING','CALLED','SERVING','COMPLETED','CANCELLED']])
    counter = models.CharField(max_length=60,blank=True)
    called_at = models.DateTimeField(null=True,blank=True)
    completed_at = models.DateTimeField(null=True,blank=True)
    def save(self,*args,**kwargs):
        if not self.token:
            import uuid
            self.token='Q-'+uuid.uuid4().hex[:8].upper()
        super().save(*args,**kwargs)
