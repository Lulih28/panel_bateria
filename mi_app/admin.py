from django.contrib import admin
from rest_framework_api_key.admin import APIKeyModelAdmin
from .models import Category, TrackEntry, UserAPIKey

@admin.register(UserAPIKey)
class UserAPIKeyAdmin(APIKeyModelAdmin):
    list_display = [*APIKeyModelAdmin.list_display, "user"]
    search_fields = [*APIKeyModelAdmin.search_fields, "user__username"]

admin.site.register(Category)
admin.site.register(TrackEntry)

