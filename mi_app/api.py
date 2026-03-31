from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_api_key.permissions import HasAPIKey
from .models import Category, TrackEntry, UserAPIKey
from .serializers import CategorySerializer, TrackEntrySerializer, UserAPIKeySerializer
from .authentication import FirebaseAuthentication

class HasUserAPIKey(HasAPIKey):
    model = UserAPIKey

    def has_permission(self, request, view):
        # We need to set request.user for the view logic
        key = self.get_key(request)
        if not key:
            return False
        
        try:
            api_key = self.model.objects.get_from_key(key)
            if api_key.revoked:
                return False
            request.user = api_key.user
            return True
        except UserAPIKey.DoesNotExist:
            return False

class UserAPIKeyListCreateAPI(generics.ListCreateAPIView):
    serializer_class = UserAPIKeySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAPIKey.objects.filter(user=self.request.user, revoked=False)

    def post(self, request, *args, **kwargs):
        name = request.data.get("name", f"Key for {request.user.username}")
        api_key, key = UserAPIKey.objects.create_key(name=name, user=request.user)
        
        serializer = self.get_serializer(api_key)
        data = serializer.data
        data["key"] = key  # Solo se devuelve una vez al crear
        return Response(data, status=status.HTTP_201_CREATED)

class UserAPIKeyRevokeAPI(generics.DestroyAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserAPIKey.objects.filter(user=self.request.user)



class CategoryListCreateAPI(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    # Allow Firebase (IsAuthenticated) OR API Key (HasUserAPIKey)
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated | HasUserAPIKey]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')


class CategoryDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated | HasUserAPIKey]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


class TrackEntryListCreateAPI(generics.ListCreateAPIView):
    serializer_class = TrackEntrySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated | HasUserAPIKey]

    def get_queryset(self):
        # Only show entries for categories owned by the user
        queryset = TrackEntry.objects.filter(category__user=self.request.user).order_by('-created_at')
        category_id = self.request.query_params.get('category', None)
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        created_at = self.request.data.get('created_at')
        if created_at:
            serializer.save(created_at=created_at)
        else:
            serializer.save()


class TrackEntryDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrackEntrySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated | HasUserAPIKey]

    def get_queryset(self):
        return TrackEntry.objects.filter(category__user=self.request.user)


class UserDeleteAPI(generics.DestroyAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        instance.delete()

