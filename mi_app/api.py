from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Category, TrackEntry
from .serializers import CategorySerializer, TrackEntrySerializer
from .authentication import FirebaseAuthentication

class CategoryListCreateAPI(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')


class CategoryDetailAPI(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


class TrackEntryListCreateAPI(generics.ListCreateAPIView):
    serializer_class = TrackEntrySerializer
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TrackEntry.objects.filter(category__user=self.request.user)


class UserDeleteAPI(generics.DestroyAPIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_destroy(self, instance):
        instance.delete()
