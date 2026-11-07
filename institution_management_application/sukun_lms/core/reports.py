import csv
import io
from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework import serializers
from .permissions import can_access, ADMIN_ROLES


class InstitutionDashboard(APIView):
    def get(self,request):
        from students.models import Student
        from staff.models import Teacher, StaffLeaveRecord
        from finance.models import StudentFee, FeePayment, FeeRefund
        from admissions.models import Lead, Application, FollowUp, Campaign
        from attendance.models import StudentAttendance
        from learning.models import Course, Submission
        from library.models import BookIssue
        from operations.models import Expense, Payroll, QueueTicket, SupportTicket
        from .models import AuditEvent
        user=request.user
        if not user.institution_id or user.user_type in {'STUDENT','PARENT'}:
            raise PermissionDenied('Use the learner portal for student and guardian information.')
        inst=user.institution; today=timezone.localdate(); since=today.replace(day=1)
        data={'institution':inst.name,'date':today,'role':user.get_user_type_display(),'metrics':[],
              'pipeline':[],'alerts':[],'recent_activity':[],'quick_links':[]}
        def metric(label,value,hint,href):
            data['metrics'].append({'label':label,'value':value,'hint':hint,'href':href})
        def alert(title,detail,href,kind='attention'):
            data['alerts'].append({'title':title,'detail':detail,'href':href,'kind':kind})
        if can_access(user,'students'):
            metric('Active students',Student.objects.filter(institution=inst,is_active=True).count(),'Across all enrolled classes','/students')
        if can_access(user,'staff'):
            teachers=Teacher.objects.filter(institution=inst,is_active=True)
            if user.user_type=='TEACHER': teachers=teachers.filter(user=user)
            metric('Teaching staff',teachers.count(),'Active staff profiles','/workspace/staff-profiles')
            pending=StaffLeaveRecord.objects.filter(teacher__institution=inst,status='PENDING')
            if user.user_type=='TEACHER': pending=pending.filter(teacher__user=user)
            if pending.exists(): alert('Leave requests to review',str(pending.count())+' pending requests','/workspace/leave')
        if can_access(user,'admissions'):
            leads=Lead.objects.filter(institution=inst)
            metric('Open enquiries',leads.exclude(stage__in=['LOST','APPLICATION']).count(),'Families exploring your institution','/workspace/enquiries')
            applications=Application.objects.filter(institution=inst)
            metric('Pending admissions',applications.filter(status__in=['SUBMITTED','UNDER_REVIEW']).count(),'Awaiting review or a decision','/workspace/applications')
            total=leads.count(); enrolled=applications.filter(status='ENROLLED',lead__isnull=False).count()
            metric('Enquiry conversion',str(round(enrolled/total*100,1) if total else 0)+'%','Linked enquiries converted to enrollment','/workspace/campaigns')
            counts={row['stage']:row['count'] for row in leads.values('stage').annotate(count=Count('id'))}
            data['pipeline']=[{'stage':stage.replace('_',' ').title(),'count':counts.get(stage,0)} for stage in ['NEW','CONTACTED','QUALIFIED','VISIT_SCHEDULED','APPLICATION','LOST']]
            overdue=FollowUp.objects.filter(lead__institution=inst,completed_at__isnull=True,due_at__lt=timezone.now())
            for item in overdue.select_related('lead').order_by('due_at')[:5]:
                alert('Follow up with '+item.lead.full_name,item.channel.title()+' · due '+item.due_at.strftime('%d %b'),'/workspace/follow-ups')
        if can_access(user,'finance'):
            fees=StudentFee.objects.filter(student__institution=inst)
            collected=FeePayment.objects.filter(student_fee__student__institution=inst,payment_date__date__gte=since).aggregate(total=Sum('amount'))['total'] or 0
            refunded=FeeRefund.objects.filter(payment__student_fee__student__institution=inst,created_at__date__gte=since).aggregate(total=Sum('amount'))['total'] or 0
            metric('Collected this month',str(collected-refunded),'Net of refunds recorded this month','/workspace/receipts')
            outstanding=fees.filter(balance__gt=0).aggregate(total=Sum('balance'))['total'] or 0
            metric('Outstanding fees',str(outstanding),'Total unpaid balance','/workspace/student-bills')
            overdue=fees.filter(balance__gt=0,due_date__lt=today)
            if overdue.exists(): alert('Overdue fee balances',str(overdue.count())+' bills need accounts follow-up','/workspace/student-bills')
        if can_access(user,'attendance'):
            attendance=StudentAttendance.objects.filter(student__institution=inst,date=today)
            total=attendance.count(); present=attendance.filter(status__in=['PRESENT','LATE']).count()
            metric('Attendance today',str(round(present/total*100,1))+'%' if total else 'Not marked',str(total)+' attendance records today','/daily-attendance')
            recent=StudentAttendance.objects.filter(student__institution=inst,date__gte=today-timedelta(days=30))
            at_risk=recent.values('student','student__user__first_name','student__user__last_name').annotate(total=Count('id'),absent=Count('id',filter=Q(status='ABSENT'))).filter(absent__gte=3).order_by('-absent')[:5]
            for record in at_risk:
                alert('Attendance check: '+record['student__user__first_name'],str(record['absent'])+' absences in the last 30 days','/students/'+str(record['student']))
        if can_access(user,'learning'):
            courses=Course.objects.filter(institution=inst)
            submissions=Submission.objects.filter(assignment__course__institution=inst,graded_at__isnull=True)
            if user.user_type=='TEACHER':
                courses=courses.filter(teacher=user); submissions=submissions.filter(assignment__course__teacher=user)
            metric('Published courses',courses.filter(status='PUBLISHED').count(),'Ready for enrolled learners','/workspace/courses')
            if submissions.exists(): alert('Student work awaiting feedback',str(submissions.count())+' submissions to grade','/workspace/grading')
        if can_access(user,'library'):
            loans=BookIssue.objects.filter(book__institution=inst,status__in=['ISSUED','OVERDUE'])
            metric('Books on loan',loans.count(),'Copies currently checked out','/workspace/loans')
            late=loans.filter(due_date__lt=today).count()
            if late: alert('Overdue library returns',str(late)+' books are past their return date','/workspace/loans')
        if can_access(user,'expenses'):
            total=Expense.objects.filter(institution=inst,status='PAID',date__gte=since).aggregate(total=Sum('amount'))['total'] or 0
            metric('Paid operating expenses',str(total),'Expenses dated this month; payroll shown separately','/workspace/expenses')
        if can_access(user,'frontdesk'):
            metric('Visitors waiting',QueueTicket.objects.filter(institution=inst,status='WAITING').count(),'Ready for a welcome at the front desk','/workspace/queue')
        if user.is_superuser or user.user_type in ADMIN_ROLES:
            data['recent_activity']=[{'actor':a.actor.full_name if a.actor else 'Former user','action':a.action,'path':a.path,'at':a.created_at} for a in AuditEvent.objects.filter(institution=inst).select_related('actor')[:8]]
        links=[('admissions','New enquiry','/workspace/enquiries'),('learning','Course studio','/workspace/courses'),
               ('finance','Record a collection','/workspace/receipts'),('staff','Staff directory','/workspace/staff-profiles'),
               ('library','Library loans','/workspace/loans'),('frontdesk','Visitor queue','/workspace/queue')]
        data['quick_links']=[{'title':title,'href':href} for module,title,href in links if can_access(user,module)]
        return Response(data)


class ReportExport(APIView):
    def get(self,request,kind):
        from finance.models import StudentFee
        from admissions.models import Lead
        from attendance.models import StudentAttendance
        config={
            'fees':('finance',StudentFee,{'student__institution':request.user.institution},
                    ['student__admission_number','student__user__first_name','student__user__last_name','fee_structure__fee_name','total_amount','amount_paid','balance','due_date','status']),
            'enquiries':('admissions',Lead,{'institution':request.user.institution},
                        ['full_name','phone','email','source','stage','next_follow_up','created_at']),
            'attendance':('attendance',StudentAttendance,{'student__institution':request.user.institution},
                          ['student__admission_number','student__user__first_name','date','status','remarks'])
        }
        if kind not in config: raise ValidationError('Unknown report.')
        module,model,scope,fields=config[kind]
        if not can_access(request.user,module): raise PermissionDenied()
        output=io.StringIO(); writer=csv.writer(output); writer.writerow([f.replace('__',' ').replace('_',' ').title() for f in fields])
        for record in model.objects.filter(**scope).order_by('pk').values_list(*fields).iterator(chunk_size=1000):
            row=[]
            for value in record:
                text='' if value is None else str(value)
                if text.lstrip().startswith(('=','+','-','@')): text="'"+text
                row.append(text)
            writer.writerow(row)
        response=HttpResponse('\ufeff'+output.getvalue(),content_type='text/csv; charset=utf-8')
        response['Content-Disposition']='attachment; filename="sukun-'+kind+'.csv"'
        response['Cache-Control']='private, no-store'
        return response
