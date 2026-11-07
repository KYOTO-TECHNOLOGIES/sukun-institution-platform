from rest_framework import serializers
from .models import Expense, Payroll, Asset, TransportRoute, TransportAllocation, HostelRoom, HostelAllocation, SupportTicket, QueueTicket


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model=Expense; fields='__all__'; read_only_fields=('status','approved_by')


class PayrollSerializer(serializers.ModelSerializer):
    employee_name=serializers.CharField(source='employee.full_name',read_only=True)
    net_pay=serializers.SerializerMethodField()
    def get_net_pay(self,obj): return obj.basic+obj.allowances-obj.deductions
    class Meta:
        model=Payroll; fields='__all__'; read_only_fields=('status','paid_at')
    def validate(self,attrs):
        get=lambda key,default=0:attrs.get(key,getattr(self.instance,key,default))
        if get('month').day!=1: raise serializers.ValidationError({'month':'Use the first day of the salary month.'})
        if get('deductions')>get('basic')+get('allowances'): raise serializers.ValidationError({'deductions':'Deductions exceed gross pay.'})
        if get('employee').user_type in {'STUDENT','PARENT'}: raise serializers.ValidationError({'employee':'Select a staff member.'})
        return attrs


def model_serializer(model,read_only=()):
    return type(model.__name__+'Serializer',(serializers.ModelSerializer,),{'Meta':type('Meta',(),{'model':model,'fields':'__all__','read_only_fields':read_only})})


AssetSerializer=model_serializer(Asset)
TransportRouteSerializer=model_serializer(TransportRoute)
HostelRoomSerializer=model_serializer(HostelRoom)


class TransportAllocationSerializer(serializers.ModelSerializer):
    student_name=serializers.CharField(source='student.user.full_name',read_only=True)
    route_name=serializers.CharField(source='route.name',read_only=True)
    class Meta:
        model=TransportAllocation; fields='__all__'


class HostelAllocationSerializer(serializers.ModelSerializer):
    student_name=serializers.CharField(source='student.user.full_name',read_only=True)
    room_name=serializers.CharField(source='room.__str__',read_only=True)
    class Meta:
        model=HostelAllocation; fields='__all__'


SupportTicketSerializer=model_serializer(SupportTicket,('created_by',))
QueueTicketSerializer=model_serializer(QueueTicket,('token','status','called_at','completed_at'))
