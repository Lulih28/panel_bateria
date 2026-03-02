"""
URL configuration for nuevocopi project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from mi_app import views as mi_views
from mi_app import api as mi_api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/categories/', mi_api.CategoryListCreateAPI.as_view(), name='api-categories'),
    path('api/categories/<int:pk>/', mi_api.CategoryDetailAPI.as_view(), name='api-category-detail'),
    path('api/entries/', mi_api.TrackEntryListCreateAPI.as_view(), name='api-entries'),
    path('api/entries/<int:pk>/', mi_api.TrackEntryDetailAPI.as_view(), name='api-entry-detail'),
    path('api/delete-account/', mi_api.UserDeleteAPI.as_view(), name='api-delete-account'),
]

