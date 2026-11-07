import os
from datetime import timedelta
from decimal import Decimal
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from accounts.models import User
from institutions.models import Institution, AcademicYear
from academics.models import Syllabus, Class, Division, Subject, ClassSubject
from students.models import Student, ParentGuardian
from staff.models import Teacher
from admissions.models import Campaign, Lead, FollowUp, Application
from finance.models import FeeStructure, StudentFee, FeePayment
from learning.models import Course, Lesson, Enrollment, Assignment, Quiz, Question
from attendance.models import StudentAttendance
from communications.models import Notification, IslamicEvent
from operations.models import Expense, Asset, TransportRoute, HostelRoom, QueueTicket, SupportTicket
from library.models import LibraryBook
from tasks.models import DailyTask


class Command(BaseCommand):
    help='Create an isolated example institution for local development; never resets existing accounts.'

    def add_arguments(self,parser):
        parser.add_argument('--password',default=os.environ.get('DEMO_PASSWORD'))
    @transaction.atomic
    def handle(self,*args,**options):
        if not settings.DEBUG:
            raise CommandError('Demo data is available only with DEBUG=True.')
        password=options['password']
        if not password: raise CommandError('Supply --password or DEMO_PASSWORD.')
        from django.contrib.auth.password_validation import validate_password
        validate_password(password)
        today=timezone.localdate()
        inst,created=Institution.objects.get_or_create(registration_number='SUKUN-DEMO',defaults=dict(
            name='Sukun Learning Academy',email='office@sukun-demo.test',phone='+919900001001',address='12 Learning Lane',
            city='Kozhikode',district='Kozhikode',state='Kerala',pincode='673001',established_year=2026,institution_type='OTHER'))
        if not created:
            self.stdout.write('Demo institution already exists; existing data and passwords were preserved.')
            return
        roles=[('INSTITUTION_ADMIN','Riya','Administrator'),('TEACHER','Hana','Teacher'),('MARKETING','Omar','Marketing'),
               ('ADMISSIONS','Sara','Admissions'),('ACCOUNTANT','Nadia','Accounts'),('LIBRARIAN','Faisal','Library'),
               ('HR','Noor','People'),('FRONT_DESK','Zoya','Reception'),('PARENT','Farah','Rahman'),('PRINCIPAL','Yusuf','Principal')]
        people={}
        for index,(role,first,last) in enumerate(roles,1):
            people[role]=User.objects.create_user(phone_number='+919900001'+str(index).zfill(3),password=password,
                first_name=first,last_name=last,email=role.lower()+'@sukun-demo.test',user_type=role,institution=inst)
        year=AcademicYear.objects.create(institution=inst,name=str(today.year)+'–'+str(today.year+1),start_date=today.replace(month=1,day=1),end_date=today.replace(month=12,day=31),is_current=True)
        syllabus=Syllabus.objects.create(institution=inst,name='Integrated learning curriculum',total_years=10,is_arabic_focused=False)
        classes=[]
        for index in range(1,4):
            cls=Class.objects.create(institution=inst,name='Grade '+str(index+5),class_order=index+5,syllabus=syllabus)
            div=Division.objects.create(class_obj=cls,name='A',capacity=30,class_teacher=people['TEACHER'],room_number='10'+str(index))
            classes.append((cls,div))
        Teacher.objects.create(user=people['TEACHER'],institution=inst,employee_id='DEMO-T01',joining_date=today-timedelta(days=120),
            qualification='M.Ed. Mathematics',designation='Senior Teacher',department='Mathematics',years_of_experience=6)
        subject=Subject.objects.create(institution=inst,name='Mathematics',subject_type='MATHS',syllabus=syllabus)
        assignment=ClassSubject.objects.create(class_obj=classes[0][0],subject=subject,academic_year=year,teacher=people['TEACHER'],periods_per_week=5)
        learners=[]
        names=[('Amina','Rahman'),('Ibrahim','Ali'),('Mariam','Hassan'),('Adam','Noor'),('Zain','Ahmed'),('Layla','Khan'),
               ('Yasmin','Noor'),('Hamza','Rahman'),('Aisha','Ali'),('Rayyan','Hassan'),('Safiya','Ahmed'),('Bilal','Khan')]
        for index,(first,last) in enumerate(names,1):
            user=User.objects.create_user(phone_number='+919900002'+str(index).zfill(3),password=password,first_name=first,last_name=last,
                email='student'+str(index)+'@sukun-demo.test',user_type='STUDENT',institution=inst)
            cls,div=classes[(index-1)%3]
            student=Student.objects.create(user=user,institution=inst,admission_number='DEMO-'+str(index).zfill(4),roll_number=str(index),
                admission_date=today-timedelta(days=60),division=div,academic_year=year,gender='FEMALE' if index%2 else 'MALE')
            learners.append(student)
            for days in range(7):
                StudentAttendance.objects.create(student=student,division=div,date=today-timedelta(days=days),
                    status='ABSENT' if index==1 and days in [1,2,4] else 'PRESENT',marked_by=people['TEACHER'])
        ParentGuardian.objects.create(student=learners[0],user=people['PARENT'],relation='MOTHER')
        for cls,div in classes:
            FeeStructure.objects.create(institution=inst,class_obj=cls,academic_year=year,fee_name='Term tuition',fee_type='TUITION',amount=4500,due_days=7)
        for i,fee in enumerate(StudentFee.objects.filter(student__institution=inst)):
            fee.due_date=today-timedelta(days=5) if i%3==0 else today+timedelta(days=7);fee.save()
            if i%3!=0:
                FeePayment.objects.create(student_fee=fee,payment_date=timezone.now(),amount=4500 if i%2 else 2000,
                    payment_method='UPI',transaction_id='DEMO-PAY-'+str(i),received_by=people['ACCOUNTANT'])
        campaign=Campaign.objects.create(institution=inst,name='A new term, a fresh start',channel='SOCIAL',status='ACTIVE',budget=25000,spent=8500,start_date=today-timedelta(days=14))
        Campaign.objects.create(institution=inst,name='Community open house',channel='EVENT',status='ACTIVE',budget=15000,spent=4500,start_date=today)
        stages=['NEW','CONTACTED','QUALIFIED','VISIT_SCHEDULED','APPLICATION','LOST']
        for i in range(12):
            lead=Lead.objects.create(institution=inst,campaign=campaign,full_name=['Aarav Nair','Meera Das','Noura Ali','Rohan Menon','Sana Ahmed','Ishaan Kumar'][i%6],
                phone='+919900003'+str(i+1).zfill(3),source='Social campaign' if i%2 else 'Referral',stage=stages[i%6],guardian_name='Demo Guardian',
                assigned_to=people['MARKETING'],next_follow_up=timezone.now()+timedelta(days=i-2),lost_reason='Joined another institution' if i%6==5 else '')
            if i<3: FollowUp.objects.create(lead=lead,due_at=timezone.now()-timedelta(hours=i+1),channel='CALL',notes='Discuss campus visit and scholarship options.',created_by=people['MARKETING'])
        Application.objects.create(institution=inst,first_name='Zara',last_name='Nair',phone='+919900004001',gender='FEMALE',
            guardian_name='Demo Guardian',division=classes[0][1],academic_year=year,documents_verified=True)
        course=Course.objects.create(institution=inst,title='Mathematics in everyday life',description='Build confidence with numbers, patterns, and practical problem-solving.',
            teacher=people['TEACHER'],class_obj=classes[0][0],status='PUBLISHED')
        for i,title in enumerate(['Welcome to your learning journey','Patterns all around us','Putting numbers to work'],1):
            Lesson.objects.create(course=course,title=title,position=i,content='Explore the patterns you see at home and at school. Write down three examples and explain how you found the pattern.\n\nTry it: continue the sequence 2, 4, 8, 16. What rule connects each number?',duration_minutes=15,is_published=True)
        for learner in learners: Enrollment.objects.create(course=course,student=learner)
        Assignment.objects.create(course=course,title='Your everyday mathematics journal',instructions='Describe three ways you used mathematics today. Explain your thinking in at least three sentences.',due_at=timezone.now()+timedelta(days=5),max_score=20,is_published=True)
        quiz=Quiz.objects.create(course=course,title='Patterns: a quick check',max_attempts=3,is_published=True)
        Question.objects.create(quiz=quiz,prompt='What comes next: 2, 4, 8, 16, …?',option_a='18',option_b='24',option_c='32',option_d='64',correct_answer='C')
        Question.objects.create(quiz=quiz,prompt='How many minutes are in two hours?',option_a='60',option_b='90',option_c='120',option_d='180',correct_answer='C',position=2)
        DailyTask.objects.create(class_subject=assignment,division=classes[0][1],teacher=people['TEACHER'],date_assigned=today,due_date=today+timedelta(days=2),task_type='HOMEWORK',title='Find five patterns',description='List five patterns you can find around your home.',max_marks=10)
        notice=Notification.objects.create(institution=inst,sender=people['INSTITUTION_ADMIN'],title='Welcome to a new chapter',message='Your learning workspace is ready. Explore your courses, keep track of your progress, and reach out to your teacher whenever you need help.',notification_type='GENERAL')
        notice.recipients.set([s.user for s in learners]+[people['PARENT']])
        IslamicEvent.objects.create(institution=inst,event_name='Family learning day',event_type='OTHER',event_date=today+timedelta(days=14),description='Meet the teachers, explore classrooms, and celebrate student work.',venue='Main campus')
        Expense.objects.create(institution=inst,title='Classroom learning supplies',category='SUPPLIES',amount=6500,date=today,vendor='Demo Education Supplies')
        Asset.objects.create(institution=inst,name='Classroom projector',asset_tag='DEMO-AV-01',category='Audio visual',quantity=3,location='Academic block',purchase_cost=45000)
        TransportRoute.objects.create(institution=inst,name='City centre route',vehicle_number='DEMO-BUS-01',driver_name='Demo Driver',driver_phone='+919900005001',capacity=30,stops='City centre\nNorth junction\nMain campus')
        HostelRoom.objects.create(institution=inst,building='East residence',room_number='101',capacity=4,gender='MALE')
        for i,name in enumerate(['Demo Visitor A','Demo Visitor B','Demo Visitor C']):
            QueueTicket.objects.create(institution=inst,visitor_name=name,service='ADMISSIONS' if i%2 else 'ACCOUNTS')
        SupportTicket.objects.create(institution=inst,title='Projector needs a new cable',category='IT',description='Please check the HDMI cable in Room 102.',created_by=people['TEACHER'])
        for i,title in enumerate(['The joy of learning','A world of numbers','Stories that stay with us']):
            LibraryBook.objects.create(institution=inst,book_id='DEMO-BK-'+str(i+1),title=title,author='Demo Library',category='GENERAL',total_copies=5,available_copies=5)
        self.stdout.write(self.style.SUCCESS('Demo institution created with 10 staff/guardian accounts and 12 learners.'))
        for i,(role,_,_) in enumerate(roles,1): self.stdout.write(role+': +919900001'+str(i).zfill(3))
        self.stdout.write('STUDENT: +919900002001')
        self.stdout.write('Passwords use the value supplied to this command; no passwords are printed.')
