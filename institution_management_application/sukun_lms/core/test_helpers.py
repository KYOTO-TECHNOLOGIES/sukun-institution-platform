from accounts.models import User
from institutions.models import Institution, AcademicYear
from academics.models import Class, Division


def institution(name='One'):
    return Institution.objects.create(name=name, registration_number=name, address='Campus',
        city='Kozhikode', district='Kozhikode', state='Kerala', pincode='673001',
        phone='+919876543210', email=name.lower()+'@example.test', established_year=2026, institution_type='OTHER')


def admin(inst, phone='+919876543210', role='INSTITUTION_ADMIN'):
    return User.objects.create_user(phone_number=phone, password='StrongPass123!',
        first_name='Test', institution=inst, user_type=role)


def academic_setup(inst):
    year = AcademicYear.objects.create(institution=inst, name='2026-27', start_date='2026-06-01', end_date='2027-03-31', is_current=True)
    cls = Class.objects.create(institution=inst, name='Grade 1', class_order=1)
    division = Division.objects.create(class_obj=cls, name='A', capacity=30)
    return year, cls, division
