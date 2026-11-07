from rest_framework import serializers
from .models import FeePayment, FeeStructure, StudentFee

class FeeStructureSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = '__all__'

class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    fee_name = serializers.CharField(source='fee_structure.fee_name', read_only=True)

    class Meta:
        model = StudentFee
        fields = '__all__'

class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_fee.student.user.get_full_name', read_only=True)
    fee_name = serializers.CharField(source='student_fee.fee_structure.fee_name', read_only=True)

    class Meta:
        model = FeePayment
        fields = '__all__'
