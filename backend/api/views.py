import csv
import io
from datetime import date

from django.db.models import Q
from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .ai_service import AIService
from .models import AnalysisRun, Decision, Meeting, MeetingTask, OpenQuestion, Risk
from .serializers import (
    DecisionSerializer,
    MeetingCreateSerializer,
    MeetingSerializer,
    MeetingTaskSerializer,
    OpenQuestionSerializer,
    RiskSerializer,
)


@api_view(['GET'])
def health_check(request):
    return Response({
        'status': 'ok',
        'provider_configured': AIService.is_configured(),
        'message': 'Meeting Action Tracker backend is running.'
    })


@api_view(['GET'])
def dashboard_summary(request):
    meetings = Meeting.objects.all()
    tasks = MeetingTask.objects.all()
    today = date.today()
    open_tasks = tasks.exclude(status='done')
    overdue = tasks.filter(due_date__lt=today, status__in=['todo', 'in_progress', 'blocked']).count()
    due_soon = tasks.filter(
        due_date__gte=today,
        status__in=['todo', 'in_progress', 'blocked']
    ).count()
    return Response({
        'total_meetings': meetings.count(),
        'open_action_items': open_tasks.count(),
        'overdue_tasks': overdue,
        'tasks_due_soon': due_soon,
        'recent_meetings': MeetingSerializer(meetings.order_by('-updated_at')[:5], many=True).data,
    })


class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-updated_at')
    serializer_class = MeetingSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return MeetingCreateSerializer
        return MeetingSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        meeting = serializer.save()
        return Response(MeetingSerializer(meeting).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def analyze_meeting(request, pk):
    meeting = Meeting.objects.get(pk=pk)
    text = meeting.notes or ''
    if not text.strip():
        return Response({'detail': 'Meeting notes are required before analyzing a meeting.'}, status=400)

    try:
        payload = AIService.analyze_meeting_text(text)
    except Exception as exc:
        return Response({'detail': str(exc)}, status=400)

    meeting.summary = payload.get('summary', '')
    meeting.analysis_status = 'analyzed'
    meeting.review_status = 'needs_review'
    meeting.save(update_fields=['summary', 'analysis_status', 'review_status', 'updated_at'])

    MeetingTask.objects.filter(meeting=meeting).delete()
    Decision.objects.filter(meeting=meeting).delete()
    Risk.objects.filter(meeting=meeting).delete()
    OpenQuestion.objects.filter(meeting=meeting).delete()

    for item in payload.get('action_items', []):
        MeetingTask.objects.create(
            meeting=meeting,
            title=item.get('title', 'Untitled task'),
            description=item.get('description', ''),
            owner=item.get('owner'),
            due_date=item.get('due_date'),
            priority=(item.get('priority') or 'medium').capitalize(),
            status='todo',
            source_excerpt=item.get('source_excerpt', ''),
            uncertainty_notes=item.get('uncertainty_notes', ''),
            review_state='needs_review',
            is_ai_generated=True,
        )

    for item in payload.get('decisions', []):
        Decision.objects.create(
            meeting=meeting,
            text=item.get('text', 'Decision not captured clearly'),
            source_excerpt=item.get('source_excerpt', ''),
            review_state='needs_review',
            is_ai_generated=True,
        )

    for item in payload.get('risks', []):
        Risk.objects.create(
            meeting=meeting,
            text=item.get('text', 'Risk was not captured clearly'),
            review_state='needs_review',
            is_ai_generated=True,
        )

    for item in payload.get('open_questions', []):
        OpenQuestion.objects.create(
            meeting=meeting,
            text=item.get('text', 'Question not captured clearly'),
            is_ai_generated=True,
        )

    AnalysisRun.objects.create(
        meeting=meeting,
        provider='OpenAI',
        status='success',
        raw_response=payload,
    )

    return Response({'detail': 'Analysis generated successfully', 'meeting': MeetingSerializer(meeting).data})


class TaskViewSet(viewsets.ModelViewSet):
    queryset = MeetingTask.objects.all().order_by('-updated_at')
    serializer_class = MeetingTaskSerializer

    def get_queryset(self):
        queryset = MeetingTask.objects.all().order_by('-updated_at')
        search = self.request.query_params.get('search', '')
        status = self.request.query_params.get('status')
        owner = self.request.query_params.get('owner')
        priority = self.request.query_params.get('priority')
        meeting_id = self.request.query_params.get('meeting_id') or self.request.query_params.get('meeting')

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if status:
            queryset = queryset.filter(status=status)
        if owner:
            queryset = queryset.filter(owner__icontains=owner)
        if priority:
            queryset = queryset.filter(priority__iexact=priority)
        if meeting_id:
            queryset = queryset.filter(meeting_id=meeting_id)
        return queryset


@api_view(['GET'])
def export_tasks_csv(request):
    tasks = MeetingTask.objects.all().select_related('meeting')
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(['meeting', 'title', 'description', 'owner', 'due_date', 'priority', 'status', 'review_state'])
    for task in tasks:
        writer.writerow([
            task.meeting.title,
            task.title,
            task.description,
            task.owner or '',
            task.due_date.isoformat() if task.due_date else '',
            task.priority or '',
            task.status,
            task.review_state,
        ])
    response = HttpResponse(buffer.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="meeting_tasks.csv"'
    return response


@api_view(['GET'])
def export_meeting_report(request, pk):
    meeting = Meeting.objects.get(pk=pk)
    tasks = meeting.tasks.all()
    lines = [
        '# Meeting Report',
        '',
        f'**Title:** {meeting.title}',
        f'**Client:** {meeting.client_name or "Unknown"}',
        f'**Date:** {meeting.meeting_date or "Not stated"}',
        '',
        '## Summary',
        meeting.summary or 'No summary recorded.',
        '',
        '## Decisions',
    ]
    for decision in meeting.decisions.all():
        lines.append(f'- {decision.text}')
    if not meeting.decisions.exists():
        lines.append('- No decisions captured.')
    lines.extend(['', '## Action Items'])
    for task in tasks:
        lines.append(f'- {task.title} | Owner: {task.owner or "Unassigned — confirmation needed."} | Due: {task.due_date or "No due date stated."} | Priority: {task.priority or "Medium"} | Status: {task.status}')
    if not tasks.exists():
        lines.append('- No action items captured.')
    lines.extend(['', '## Risks'])
    for risk in meeting.risks.all():
        lines.append(f'- {risk.text}')
    if not meeting.risks.exists():
        lines.append('- No risks recorded.')
    lines.extend(['', '## Open Questions'])
    for question in meeting.open_questions.all():
        lines.append(f'- {question.text}')
    if not meeting.open_questions.exists():
        lines.append('- No open questions.')
    report = '\n'.join(lines)
    response = HttpResponse(report, content_type='text/markdown; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{meeting.title.lower().replace(" ", "_")}_report.md"'
    return response
