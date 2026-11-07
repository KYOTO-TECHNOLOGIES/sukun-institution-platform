from decimal import Decimal
from rest_framework import serializers
from .models import FeePayment, FeeStructure, StudentFee, FeeRefund


class FeeStructureSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source='class_obj.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    class Meta:
        model = FeeStructure
        fields = '__all__'
    def validate_amount(self, value):
        if value <= 0: raise serializers.ValidationError('Fee amount must be positive.')
        return value
    def validate_due_days(self,value):
        if value < 0: raise serializers.ValidationError('Due days cannot be negative.')
        return value


class StudentFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    fee_name = serializers.CharField(source='fee_structure.fee_name', read_only=True)
    class Meta:
        model = StudentFee
        fields = '__all__'
        read_only_fields = ('amount_paid','balance','status')
    def validate(self,attrs):
        total=attrs.get('total_amount',getattr(self.instance,'total_amount',0))
        paid=getattr(self.instance,'amount_paid',0)
        if total < 0 or total < paid:
            raise serializers.ValidationError({'total_amount':'Total must be nonnegative and cannot be less than payments received.'})
        if self.instance:
            for key in ('student','fee_structure','academic_year'):
                if key in attrs and attrs[key].pk != getattr(self.instance,key+'_id'):
                    raise serializers.ValidationError({key:'An issued fee cannot be reassigned.'})
        return attrs


class FeePaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student_fee.student.user.get_full_name', read_only=True)
    fee_name = serializers.CharField(source='student_fee.fee_structure.fee_name', read_only=True)
    refunded_amount = serializers.SerializerMethodField()
    class Meta:
        model = FeePayment
        fields = '__all__'
        read_only_fields = ('received_by','receipt_number')
    def get_refunded_amount(self,obj):
        from django.db.models import Sum
        return obj.refunds.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    def validate_amount(self,value):
        if value <= 0: raise serializers.ValidationError('Payment amount must be positive.')
        return value


class FeeRefundSerializer(serializers.ModelSerializer):
    receipt_number = serializers.CharField(source='payment.receipt_number',read_only=True)
    class Meta:
        model = FeeRefund
        fields = '__all__'
        read_only_fields = ('refunded_by',)
    def validate_amount(self,value):
        if value <= 0: raise serializers.ValidationError('Refund amount must be positive.')
        return value
