from rest_framework import serializers, validators
from .models import Category, TrackEntry

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Category
        fields = ['id', 'user', 'name', 'unit', 'icon', 'is_system', 'created_at']
        validators = [
            validators.UniqueTogetherValidator(
                queryset=Category.objects.all(),
                fields=['user', 'name'],
                message="Esta categoría ya existe."
            )
        ]


class TrackEntrySerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    unit = serializers.ReadOnlyField(source='category.unit')

    class Meta:
        model = TrackEntry
        fields = ['id', 'category', 'category_name', 'unit', 'value', 'note', 'device_id', 'created_at']
