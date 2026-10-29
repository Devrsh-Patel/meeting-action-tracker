from django.contrib import admin

from .models import AnalysisRun, Decision, Meeting, MeetingTask, OpenQuestion, Risk

admin.site.register(Meeting)
admin.site.register(MeetingTask)
admin.site.register(Decision)
admin.site.register(Risk)
admin.site.register(OpenQuestion)
admin.site.register(AnalysisRun)
