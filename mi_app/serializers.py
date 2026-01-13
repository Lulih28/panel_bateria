from rest_framework import serializers
from .models import BatteryRecord


class BatteryRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatteryRecord
        fields = ['id', 'level', 'device_id', 'created_at']
