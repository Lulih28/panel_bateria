from rest_framework import generics, permissions
from .models import BatteryRecord
from .serializers import BatteryRecordSerializer


class BatteryListCreateAPI(generics.ListCreateAPIView):
    queryset = BatteryRecord.objects.all().order_by('-created_at')
    serializer_class = BatteryRecordSerializer
    permission_classes = [permissions.AllowAny]
