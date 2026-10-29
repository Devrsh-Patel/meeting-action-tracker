from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MeetingViewSet,
    TaskViewSet,
    analyze_meeting,
    dashboard_summary,
    export_meeting_report,
    export_tasks_csv,
    health_check,
)

router = DefaultRouter()
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('health/', health_check, name='health'),
    path('dashboard/', dashboard_summary, name='dashboard-summary'),
    path('tasks/export-csv/', export_tasks_csv, name='export-tasks-csv'),
    path('meetings/<int:pk>/analyze/', analyze_meeting, name='analyze-meeting'),
    path('meetings/<int:pk>/export-report/', export_meeting_report, name='export-meeting-report'),
    path('', include(router.urls)),
]
