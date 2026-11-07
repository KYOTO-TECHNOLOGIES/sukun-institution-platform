from rest_framework import serializers


class WritableModelSerializer(serializers.ModelSerializer):
    pass


def build_model_serializer(model):
    labels={
        'academics.division':{'class_name':'class_obj.name','teacher_name':'class_teacher.full_name'},
        'academics.classsubject':{'teacher_name':'teacher.full_name'},
        'academics.timetable':{'division_name':'division.__str__','subject_name':'class_subject.subject.name','day_name':'get_day_of_week_display'},
        'examinations.exam':{'exam_name':'exam_type.name','class_name':'class_obj.name','subject_name':'subject.name'},
        'examinations.examresult':{'student_name':'student.user.full_name','exam_name':'exam.exam_type.name','subject_name':'exam.subject.name'},
        'tasks.dailytask':{'division_name':'division.__str__'},
        'tasks.tasksubmission':{'student_name':'student.user.full_name','task_title':'task.title'},
        'students.parentguardian':{'student_name':'student.user.full_name','parent_name':'user.full_name'},
    }
    meta=type('Meta',(),{'model':model,'fields':'__all__','read_only_fields':('marked_by','evaluated_by','completed_by','noted_by','sender','reported_by','issued_by')})
    attrs={'Meta':meta,'display_name':serializers.CharField(source='__str__',read_only=True)}
    for name,path in labels.get(model._meta.label_lower,{}).items():
        attrs[name]=serializers.CharField(source=path,read_only=True)
    if model._meta.app_label=='students' and any(f.name=='student' for f in model._meta.fields):
        attrs['student_name']=serializers.CharField(source='student.user.full_name',read_only=True)
    return type(model.__name__+'Serializer',(WritableModelSerializer,),attrs)
