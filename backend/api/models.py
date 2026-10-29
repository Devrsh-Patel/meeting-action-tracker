from django.db import models


class Meeting(models.Model):
    ANALYSIS_STATUS_CHOICES = [
        ('manual_only', 'Manual only'),
        ('analyzed', 'Analyzed'),
        ('needs_review', 'Needs review'),
    ]
    REVIEW_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('needs_review', 'Needs review'),
        ('confirmed', 'Confirmed'),
    ]

    title = models.CharField(max_length=200)
    client_name = models.CharField(max_length=200, blank=True)
    meeting_date = models.DateField(null=True, blank=True)
    participants = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    source_label = models.CharField(max_length=200, blank=True)
    summary = models.TextField(blank=True)
    analysis_status = models.CharField(max_length=30, choices=ANALYSIS_STATUS_CHOICES, default='manual_only')
    review_status = models.CharField(max_length=30, choices=REVIEW_STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class MeetingTask(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To do'),
        ('in_progress', 'In progress'),
        ('blocked', 'Blocked'),
        ('done', 'Done'),
    ]
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    REVIEW_CHOICES = [
        ('needs_review', 'Needs review'),
        ('confirmed', 'Confirmed'),
    ]

    meeting = models.ForeignKey(Meeting, related_name='tasks', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.CharField(max_length=150, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    source_excerpt = models.TextField(blank=True)
    uncertainty_notes = models.TextField(blank=True)
    review_state = models.CharField(max_length=20, choices=REVIEW_CHOICES, default='needs_review')
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class Decision(models.Model):
    meeting = models.ForeignKey(Meeting, related_name='decisions', on_delete=models.CASCADE)
    text = models.TextField()
    source_excerpt = models.TextField(blank=True)
    review_state = models.CharField(max_length=20, choices=[('needs_review', 'Needs review'), ('confirmed', 'Confirmed')], default='needs_review')
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:60]


class Risk(models.Model):
    meeting = models.ForeignKey(Meeting, related_name='risks', on_delete=models.CASCADE)
    text = models.TextField()
    review_state = models.CharField(max_length=20, choices=[('needs_review', 'Needs review'), ('confirmed', 'Confirmed')], default='needs_review')
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:60]


class OpenQuestion(models.Model):
    meeting = models.ForeignKey(Meeting, related_name='open_questions', on_delete=models.CASCADE)
    text = models.TextField()
    response_status = models.CharField(max_length=30, default='open', blank=True)
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:60]


class AnalysisRun(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='analysis_runs')
    provider = models.CharField(max_length=50, default='OpenAI')
    status = models.CharField(max_length=30, default='success')
    raw_response = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.provider} run for {self.meeting.title}'
