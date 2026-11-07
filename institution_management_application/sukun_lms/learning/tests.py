from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase
from core.test_helpers import institution, admin, academic_setup
from students.models import Student, ParentGuardian
from .models import Course, Lesson, Enrollment, Assignment, Submission, Quiz, Question, QuizAttempt


class LearningWorkflowTests(APITestCase):
    def setUp(self):
        self.inst = institution()
        self.staff = admin(self.inst)
        self.teacher = admin(self.inst, '+919876543212', 'TEACHER')
        self.user = admin(self.inst, '+919876543211', 'STUDENT')
        year, cls, division = academic_setup(self.inst)
        self.student = Student.objects.create(user=self.user,institution=self.inst,admission_number='SK-1',
            roll_number='1',admission_date=timezone.localdate(),division=division,academic_year=year,gender='MALE')
        self.course = Course.objects.create(institution=self.inst,title='Mathematics',teacher=self.teacher,status='PUBLISHED')
        self.enrollment = Enrollment.objects.create(course=self.course,student=self.student)
        self.lesson = Lesson.objects.create(course=self.course,title='Addition',content='Two plus two',is_published=True)
        self.url = f'/api/portal/courses/{self.enrollment.pk}/'
        self.client.force_authenticate(self.user)

    def test_lesson_completion_is_idempotent(self):
        path = self.url+f'lessons/{self.lesson.pk}/complete/'
        self.assertEqual(self.client.post(path).status_code,201)
        self.assertEqual(self.client.post(path).status_code,200)
        self.assertEqual(self.enrollment.progress.count(),1)
        self.assertEqual(self.client.get('/api/portal/overview/').data['courses'][0]['progress'],100)

    def test_other_student_cannot_access_enrollment(self):
        other = admin(self.inst,'+919876543213','STUDENT')
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get(self.url).status_code,404)

    def test_draft_lesson_cannot_be_completed(self):
        self.lesson.is_published=False; self.lesson.save()
        self.assertEqual(self.client.post(self.url+f'lessons/{self.lesson.pk}/complete/').status_code,404)

    def test_parent_can_read_but_not_submit(self):
        parent = admin(self.inst,'+919876543214','PARENT')
        ParentGuardian.objects.create(student=self.student,user=parent,relation='GUARDIAN')
        self.client.force_authenticate(parent)
        self.assertEqual(self.client.get(self.url).status_code,200)
        self.assertEqual(self.client.post(self.url+f'lessons/{self.lesson.pk}/complete/').status_code,403)

    def test_submission_grading_and_lock(self):
        assignment = Assignment.objects.create(course=self.course,title='Practice',instructions='Solve',due_at=timezone.now()-timedelta(hours=1),is_published=True)
        path = self.url+f'assignments/{assignment.pk}/submit/'
        response=self.client.post(path,{'answer':'Four'})
        self.assertEqual(response.status_code,201,response.data)
        self.assertTrue(response.data['is_late'])
        sub=Submission.objects.get(assignment=assignment)
        self.client.force_authenticate(self.teacher)
        self.assertEqual(self.client.patch(f'/api/learning/submissions/{sub.pk}/',{'score':101}).status_code,400)
        self.assertEqual(self.client.patch(f'/api/learning/submissions/{sub.pk}/',{'score':90,'feedback':'Well done'}).status_code,200)
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post(path,{'answer':'Changed'}).status_code,400)

    def test_quiz_does_not_expose_answer_and_limits_attempts(self):
        quiz=Quiz.objects.create(course=self.course,title='Basics',max_attempts=1,is_published=True)
        question=Question.objects.create(quiz=quiz,prompt='2+2?',option_a='4',option_b='5',correct_answer='A')
        body=self.client.get(self.url).data
        self.assertNotIn('correct_answer',body['quizzes'][0]['questions'][0])
        path=self.url+f'quizzes/{quiz.pk}/attempt/'
        response=self.client.post(path,{'answers':{str(question.pk):'A'}},format='json')
        self.assertEqual(response.status_code,201,response.data)
        self.assertTrue(response.data['passed'])
        self.assertEqual(self.client.post(path,{'answers':{str(question.pk):'A'}},format='json').status_code,400)

    def test_teacher_cannot_modify_another_teachers_course(self):
        other=admin(self.inst,'+919876543215','TEACHER')
        self.client.force_authenticate(other)
        self.assertEqual(self.client.patch(f'/api/learning/courses/{self.course.pk}/',{'title':'Wrong'}).status_code,404)
        self.assertEqual(self.client.post('/api/learning/lessons/',{'course':str(self.course.pk),'title':'Wrong'}).status_code,403)
