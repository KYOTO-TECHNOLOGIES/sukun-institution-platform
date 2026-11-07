from django.db.models import Q
from rest_framework.exceptions import ValidationError


def validate_domain(model, data, instance=None):
    def value(key, default=None):
        return data.get(key, getattr(instance,key,default))
    label=model._meta.label_lower
    for start,end in [('start_date','end_date'),('from_date','to_date'),('start_time','end_time'),('time_from','time_to'),('date_assigned','due_date')]:
        a,b=value(start),value(end)
        if a is not None and b is not None and b<a:
            raise ValidationError({end:'Must be on or after '+start.replace('_',' ')+'.'})
    if label=='institutions.academicyear' and value('start_date')==value('end_date'):
        raise ValidationError({'end_date':'Academic year must span more than one day.'})
    if label=='students.student':
        user=value('user')
        if user and user.user_type!='STUDENT':
            raise ValidationError({'user':'Select a student account.'})
    if label=='students.parentguardian' and value('user') and value('user').user_type!='PARENT':
        raise ValidationError({'user':'Select a parent account.'})
    if label=='staff.teacher' and value('user') and value('user').user_type not in {'TEACHER','PRINCIPAL'}:
        raise ValidationError({'user':'Select a teacher or principal account.'})
    if label in {'attendance.studentattendance','tasks.dailytask','tasks.tasksubmission','examinations.examresult','finance.studentfee','academics.timetable','learning.enrollment'}:
        student=value('student')
        division=value('division')
        if student and division and student.division_id!=division.pk:
            raise ValidationError({'division':'This student is not in the selected division.'})
        if label=='tasks.tasksubmission' and student and value('task').division_id!=student.division_id:
            raise ValidationError({'student':'This homework belongs to another division.'})
        if label=='examinations.examresult':
            exam=value('exam')
            if student and (not student.division or student.division.class_obj_id!=exam.class_obj_id):
                raise ValidationError({'student':'This exam belongs to another class.'})
            if value('marks_obtained') is not None and not 0<=value('marks_obtained')<=exam.max_marks:
                raise ValidationError({'marks_obtained':'Marks must be between zero and the exam maximum.'})
        if label=='finance.studentfee':
            structure=value('fee_structure')
            if structure and student and (not student.division or student.division.class_obj_id!=structure.class_obj_id):
                raise ValidationError({'fee_structure':'This fee is for another class.'})
            if structure and value('academic_year')!=structure.academic_year:
                raise ValidationError({'academic_year':'Use the fee structure academic year.'})
        subject=value('class_subject')
        if subject and division and subject.class_obj_id!=division.class_obj_id:
            raise ValidationError({'class_subject':'Select a subject assigned to this class.'})
    if label=='academics.timetable':
        start,end=value('start_time'),value('end_time')
        if start>=end: raise ValidationError({'end_time':'End time must follow the start time.'})
        subject=value('class_subject'); division=value('division'); day=value('day_of_week')
        others=model.objects.filter(day_of_week=day,start_time__lt=end,end_time__gt=start).exclude(pk=getattr(instance,'pk',None))
        if others.filter(division=division).exists():
            raise ValidationError('This division already has a lesson in that time slot.')
        if subject.teacher_id and others.filter(class_subject__teacher=subject.teacher).exists():
            raise ValidationError('This teacher is already assigned during that time slot.')
    if label=='examinations.exam':
        if value('max_marks') is not None and value('max_marks')<=0: raise ValidationError({'max_marks':'Maximum marks must be positive.'})
        if value('pass_marks') is not None and not 0<=value('pass_marks')<=value('max_marks'): raise ValidationError({'pass_marks':'Pass marks must be within the exam maximum.'})
