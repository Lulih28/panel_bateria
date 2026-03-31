from rest_framework import viewsets, permissions, response, status
from .models import UserAPIKey
from .serializers import UserAPIKeySerializer

class UserAPIKeyViewSet(viewsets.ModelViewSet):
    serializer_class = UserAPIKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAPIKey.objects.filter(user=self.request.user, revoked=False)

    def create(self, request, *args, **kwargs):
        name = request.data.get("name", f"Key for {request.user.username}")
        api_key, key = UserAPIKey.objects.create_key(name=name, user=request.user)
        
        serializer = self.get_serializer(api_key)
        data = serializer.data
        data["key"] = key  # Solo se devuelve una vez al crear
        return response.Response(data, status=status.HTTP_201_CREATED)

