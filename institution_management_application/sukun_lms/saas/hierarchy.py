from uuid import UUID
from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from core.permissions import can_access, ADMIN_ROLES


class HierarchyView(APIView):
    def get(self, request):
        from academics.models import Class, Division
        user = request.user
        if not user.institution_id or not can_access(user, 'academics'):
            raise PermissionDenied()
        classes = Class.objects.filter(institution_id=user.institution_id, is_active=True).select_related('syllabus').order_by('class_order', 'name')
        class_id = request.query_params.get('class_id')
        if class_id:
            try: class_id = UUID(class_id)
            except ValueError: raise ValidationError({'class_id': 'Select a valid class.'})
            classes = classes.filter(pk=class_id)
        total = classes.count()
        classes = list(classes[:150])
        divisions = Division.objects.filter(class_obj__in=classes, is_active=True).select_related('class_teacher').annotate(
            enrolled=Count('students', filter=Q(students__is_active=True))).order_by('class_obj_id','name')
        division_total = divisions.count()
        divisions = list(divisions[:600])
        show_people = can_access(user, 'staff')
        show_students = can_access(user, 'students')
        return Response({'institution': {'id': str(user.institution_id), 'name': user.institution.name},
            'classes': [{'id': str(c.pk), 'name': c.name, 'syllabus_id': str(c.syllabus_id) if c.syllabus_id else 'general',
                         'syllabus': c.syllabus.name if c.syllabus else 'General curriculum'} for c in classes],
            'divisions': [{'id': str(d.pk), 'class_id': str(d.class_obj_id), 'name': d.name, 'capacity': d.capacity,
                'enrolled': d.enrolled if show_students else None, 'room': d.room_number,
                'teacher': d.class_teacher.full_name if show_people and d.class_teacher else ''} for d in divisions],
            'total_classes': total, 'truncated': total > 150 or division_total > 600})


class SetupView(APIView):
    def get(self, request):
        from institutions.models import AcademicYear
        from academics.models import Class, Division, ClassSubject, TimeTable
        from accounts.models import User
        from students.models import Student
        if request.user.user_type not in ADMIN_ROLES or not request.user.institution_id:
            raise PermissionDenied()
        inst = request.user.institution_id
        checks = [
            ('Academic year', 'Set the current teaching period.', AcademicYear.objects.filter(institution_id=inst,is_current=True,is_active=True).exists(), '/workspace/academic-years'),
            ('Classes & divisions', 'Organize the campus and its capacity.', Division.objects.filter(class_obj__institution_id=inst,is_active=True).exists(), '/hierarchy'),
            ('Teaching team', 'Invite teachers with their own accounts.', User.objects.filter(institution_id=inst,user_type='TEACHER',is_active=True).exists(), '/workspace/accounts'),
            ('Teaching assignments', 'Connect subjects, classes, and teachers.', ClassSubject.objects.filter(class_obj__institution_id=inst,teacher__isnull=False,is_active=True).exists(), '/workspace/class-subjects'),
            ('Student intake', 'Enroll your first students.', Student.objects.filter(institution_id=inst,is_active=True).exists(), '/workspace/students'),
            ('Timetable', 'Give each class a clear weekly schedule.', TimeTable.objects.filter(division__class_obj__institution_id=inst,is_active=True).exists(), '/workspace/timetable'),
        ]
        return Response({'steps':[{'title':title,'description':description,'complete':done,'href':href} for title,description,done,href in checks]})
