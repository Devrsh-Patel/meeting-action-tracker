"""
URL configuration for meeting_tracker project.
"""
from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse

def home_view(request):
    return JsonResponse({
        "status": "healthy",
        "service": "Scalezix Client Meeting-to-Action Tracker API",
        "endpoints": {
            "health": "/api/health/",
            "meetings": "/api/meetings/",
            "tasks": "/api/tasks/",
            "csv_export": "/api/tasks/export-csv/",
            "report_export": "/api/meetings/<id>/export-report/",
        }
    })

urlpatterns = [
    path('', home_view, name='home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
