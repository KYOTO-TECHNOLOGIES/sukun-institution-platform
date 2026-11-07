from decimal import Decimal
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from students.models import Student
from finance.models import StudentFee
from attendance.models import StudentAttendance
from examinations.models import ExamResult
from communications.models import Notification
from tasks.models import DailyTask, TaskSubmission
from .models import Enrollment, Lesson, LessonProgress, Assignment, Submission, Quiz, QuizAttempt


def portal_students(user):
    qs = Student.objects.filter(institution=user.institution, is_active=True).select_related('user','division__class_obj')
    if user.user_type == 'STUDENT':
        return qs.filter(user=user)
    if user.user_type == 'PARENT':
        return qs.filter(parents__user=user).distinct()
    raise PermissionDenied('This portal is for students and their linked guardians.')


def enrollment_for(user, pk, write=False):
    if write and user.user_type != 'STUDENT':
        raise PermissionDenied('Only the student can submit learning work.')
    return get_object_or_404(Enrollment.objects.select_related('course','student'),
        pk=pk, student__in=portal_students(user), status__in=['ACTIVE','COMPLETED'], course__status='PUBLISHED')


class PortalOverview(APIView):
    def get(self, request):
        students = portal_students(request.user)
        selected = request.query_params.get('student')
        student = get_object_or_404(students, pk=selected) if selected else students.first()
        children = [{'id':str(s.pk),'name':s.user.full_name,'admission_number':s.admission_number} for s in students]
        if not student:
            return Response({'students':children,'student':None,'courses':[],'fees':[],'attendance':[],'results':[],'notices':[],'tasks':[]})
        enrollments = Enrollment.objects.filter(student=student, course__status='PUBLISHED', status__in=['ACTIVE','COMPLETED']).select_related('course__teacher')
        courses = []
        for enrollment in enrollments:
            total = enrollment.course.lessons.filter(is_published=True,is_active=True).count()
            complete = enrollment.progress.filter(lesson__is_published=True,lesson__is_active=True).count()
            courses.append({'id':str(enrollment.pk),'title':enrollment.course.title,'description':enrollment.course.description,
                'teacher':enrollment.course.teacher.full_name,'completed':complete,'total':total,
                'progress':round(complete/total*100) if total else 0})
        fees = list(StudentFee.objects.filter(student=student).values('id','fee_structure__fee_name','total_amount','amount_paid','balance','status','due_date'))
        attendance = list(StudentAttendance.objects.filter(student=student).order_by('-date').values('date','status','remarks')[:90])
        results = list(ExamResult.objects.filter(student=student, exam__exam_type__is_published=True).values('exam__exam_type__name','exam__subject__name','exam__max_marks','marks_obtained','grade','remarks'))
        notices = list(Notification.objects.filter(institution=student.institution, recipients=request.user).order_by('-sent_at').values('id','title','message','notification_type','sent_at')[:30])
        tasks = list(DailyTask.objects.filter(division=student.division).order_by('-due_date').values('id','title','description','due_date','task_type')[:30])
        submissions = {str(s.task_id):s for s in TaskSubmission.objects.filter(student=student)}
        for task in tasks:
            submission = submissions.get(str(task['id']))
            task['submission'] = {'text':submission.submission_text,'score':submission.marks_obtained,'feedback':submission.teacher_remarks,'status':submission.status} if submission else None
        return Response({'students':children,'student':{'id':str(student.pk),'name':student.user.full_name,'admission_number':student.admission_number,
            'division':str(student.division) if student.division else 'Not assigned'},'courses':courses,'fees':fees,
            'attendance':attendance,'results':results,'notices':notices,'tasks':tasks})


class PortalCourse(APIView):
    def get(self, request, pk):
        enrollment = enrollment_for(request.user,pk)
        completed = set(enrollment.progress.values_list('lesson_id',flat=True))
        lessons = [{'id':str(l.pk),'title':l.title,'content':l.content,'video_url':l.video_url,'resource_url':l.resource_url,
            'duration_minutes':l.duration_minutes,'completed':l.pk in completed} for l in enrollment.course.lessons.filter(is_published=True,is_active=True)]
        assignments = []
        for a in enrollment.course.assignments.filter(is_published=True,is_active=True):
            sub = a.submissions.filter(enrollment=enrollment).first()
            assignments.append({'id':str(a.pk),'title':a.title,'instructions':a.instructions,'due_at':a.due_at,'max_score':a.max_score,
                'submission': {'answer':sub.answer,'attachment_url':sub.attachment_url,'score':sub.score,'feedback':sub.feedback,'is_late':sub.is_late} if sub else None})
        quizzes = []
        for quiz in enrollment.course.quizzes.filter(is_published=True,is_active=True):
            quizzes.append({'id':str(quiz.pk),'title':quiz.title,'pass_percentage':quiz.pass_percentage,'max_attempts':quiz.max_attempts,
                'questions':list(quiz.questions.order_by('position').values('id','prompt','option_a','option_b','option_c','option_d')),
                'attempts':list(quiz.attempts.filter(enrollment=enrollment).order_by('-created_at').values('id','score','passed','created_at'))})
        return Response({'id':str(enrollment.pk),'title':enrollment.course.title,'description':enrollment.course.description,
                         'lessons':lessons,'assignments':assignments,'quizzes':quizzes})


class CompleteLesson(APIView):
    def post(self, request, pk, lesson_id):
        enrollment = enrollment_for(request.user,pk,write=True)
        lesson = get_object_or_404(Lesson,pk=lesson_id,course=enrollment.course,is_published=True,is_active=True)
        progress, created = LessonProgress.objects.get_or_create(enrollment=enrollment,lesson=lesson)
        return Response({'completed':True,'completed_at':progress.completed_at},status=201 if created else 200)


class SubmitAssignment(APIView):
    @transaction.atomic
    def post(self, request, pk, assignment_id):
        enrollment = enrollment_for(request.user,pk,write=True)
        Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        assignment = get_object_or_404(Assignment,pk=assignment_id,course=enrollment.course,is_published=True,is_active=True)
        from rest_framework import serializers
        class AnswerSerializer(serializers.Serializer):
            answer = serializers.CharField(max_length=50000)
            attachment_url = serializers.URLField(required=False,allow_blank=True)
        data = AnswerSerializer(data=request.data); data.is_valid(raise_exception=True)
        existing = Submission.objects.filter(enrollment=enrollment,assignment=assignment).first()
        if existing and existing.graded_at:
            raise ValidationError('A graded submission is locked. Contact your teacher.')
        submission, created = Submission.objects.update_or_create(enrollment=enrollment,assignment=assignment,
            defaults={**data.validated_data,'is_late':timezone.now()>assignment.due_at})
        return Response({'id':str(submission.pk),'is_late':submission.is_late},status=201 if created else 200)


class AttemptQuiz(APIView):
    @transaction.atomic
    def post(self, request, pk, quiz_id):
        enrollment = enrollment_for(request.user,pk,write=True)
        Enrollment.objects.select_for_update().get(pk=enrollment.pk)
        quiz = get_object_or_404(Quiz,pk=quiz_id,course=enrollment.course,is_published=True,is_active=True)
        if quiz.attempts.filter(enrollment=enrollment).count() >= quiz.max_attempts:
            raise ValidationError('You have used all attempts for this quiz.')
        questions = list(quiz.questions.all())
        answers = request.data.get('answers', {})
        if not questions:
            raise ValidationError('This quiz has no questions yet.')
        if not isinstance(answers,dict) or set(answers) != {str(q.pk) for q in questions}:
            raise ValidationError('Answer every question in this quiz.')
        for q in questions:
            value = answers[str(q.pk)]
            if value not in {'A','B','C','D'} or not getattr(q,'option_'+value.lower()):
                raise ValidationError('Select a valid option for every question.')
        correct = sum(answers[str(q.pk)] == q.correct_answer for q in questions)
        score = (Decimal(correct)*100/Decimal(len(questions))).quantize(Decimal('0.01'))
        attempt = QuizAttempt.objects.create(quiz=quiz,enrollment=enrollment,answers=answers,score=score,passed=score>=quiz.pass_percentage)
        return Response({'id':str(attempt.pk),'score':score,'passed':attempt.passed},status=201)


class SubmitHomework(APIView):
    @transaction.atomic
    def post(self, request, task_id):
        if request.user.user_type != 'STUDENT':
            raise PermissionDenied('Only students can submit homework.')
        student = get_object_or_404(portal_students(request.user), user=request.user)
        task = get_object_or_404(DailyTask,pk=task_id,division=student.division)
        text = request.data.get('submission_text','')
        if not isinstance(text,str) or not text.strip() or len(text)>50000:
            raise ValidationError('Enter your homework answer (maximum 50,000 characters).')
        Student.objects.select_for_update().get(pk=student.pk)
        existing = TaskSubmission.objects.filter(task=task,student=student).first()
        if existing and existing.status == 'EVALUATED':
            raise ValidationError('This homework has already been evaluated.')
        submission, created = TaskSubmission.objects.update_or_create(task=task,student=student,
            defaults={'submission_text':text,'status':'LATE' if timezone.localdate()>task.due_date else 'SUBMITTED'})
        return Response({'id':str(submission.pk)},status=201 if created else 200)
