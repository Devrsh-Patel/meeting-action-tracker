import datetime
from django.test import TestCase
from api.models import Meeting, MeetingTask, Decision, Risk, OpenQuestion


class MeetingActionTrackerApiTests(TestCase):
    def setUp(self):
        self.meeting = Meeting.objects.create(
            title='Executive Architecture Review',
            client_name='Acme Healthcare',
            meeting_date=datetime.date(2026, 10, 29),
            participants='Alice Cooper, Bob Vance',
            notes='Alice will finalize the Terraform IAM security policies by Nov 4th. Need confirmation on pricing model.',
            summary='Alignment on Terraform infrastructure and compliance requirements.',
            analysis_status='analyzed',
            review_status='needs_review',
        )

        self.task_assigned = MeetingTask.objects.create(
            meeting=self.meeting,
            title='Finalize Terraform IAM security policies',
            owner='Alice Cooper',
            due_date=datetime.date(2026, 11, 4),
            status='in_progress',
            priority='high',
            review_state='confirmed',
            source_excerpt='Alice will finalize the Terraform IAM security policies by Nov 4th.',
        )

        # Rule 2 & Rule 3: Null owner and due_date must be preserved without hallucination
        self.task_unassigned = MeetingTask.objects.create(
            meeting=self.meeting,
            title='Review pricing tier and customer seat allocation',
            owner=None,
            due_date=None,
            status='todo',
            priority='medium',
            review_state='needs_review',
            uncertainty_notes='No owner or deadline was stated in the meeting notes.',
        )

        self.decision = Decision.objects.create(
            meeting=self.meeting,
            text='Target staging infrastructure deployment scheduled for Friday, November 6th.',
            review_state='confirmed',
        )

        self.risk = Risk.objects.create(
            meeting=self.meeting,
            text='AWS GPU compute quota increases could delay LLM pipeline deployment.',
            review_state='needs_review',
        )

        self.question = OpenQuestion.objects.create(
            meeting=self.meeting,
            text='Is multi-region failover required for pilot phase?',
            response_status='open',
        )

    # 1. Health
    def test_health_endpoint_available(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get('status'), 'ok')

    # 2. Meeting validation - Title required
    def test_meeting_creation_requires_title(self):
        response = self.client.post('/api/meetings/', {'title': '', 'notes': 'Sample notes'})
        self.assertEqual(response.status_code, 400)

    # 3. Meeting creation with valid payload
    def test_meeting_creation_accepts_valid_payload(self):
        payload = {
            'title': 'Client Strategy Sync',
            'client_name': 'Northwind Ltd',
            'meeting_date': '2026-10-30',
            'notes': 'Follow up on onboarding and contract renewal.',
        }
        response = self.client.post('/api/meetings/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['title'], 'Client Strategy Sync')

    # 4. Accuracy Rules: Null owner & due date handling
    def test_task_creation_preserves_unassigned_owner_and_due_date(self):
        payload = {
            'meeting': self.meeting.id,
            'title': 'Audit legacy encryption certificates',
            'owner': None,
            'due_date': None,
            'status': 'todo',
            'priority': 'medium',
            'review_state': 'needs_review',
        }
        response = self.client.post('/api/tasks/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIsNone(data['owner'])
        self.assertIsNone(data['due_date'])

    # 5. Task status & review state patch
    def test_task_patch_status_and_review_state(self):
        payload = {
            'status': 'done',
            'review_state': 'confirmed',
        }
        response = self.client.patch(f'/api/tasks/{self.task_assigned.id}/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.task_assigned.refresh_from_db()
        self.assertEqual(self.task_assigned.status, 'done')
        self.assertEqual(self.task_assigned.review_state, 'confirmed')

    # 6. Dashboard metrics
    def test_dashboard_metrics_calculation(self):
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreaterEqual(data['total_meetings'], 1)
        self.assertGreaterEqual(data['open_action_items'], 2)
        self.assertIn('tasks_due_soon', data)
        self.assertIn('overdue_tasks', data)

    # 7. CSV Export
    def test_export_tasks_csv(self):
        response = self.client.get(f'/api/tasks/export-csv/?meeting={self.meeting.id}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv')
        content = response.content.decode('utf-8')
        self.assertIn('meeting,title,description,owner,due_date,priority,status,review_state', content)
        self.assertIn('Finalize Terraform IAM security policies', content)
        self.assertIn('Alice Cooper', content)

    # 8. Markdown Export
    def test_export_meeting_report_markdown(self):
        response = self.client.get(f'/api/meetings/{self.meeting.id}/export-report/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/markdown', response['Content-Type'])
        content = response.content.decode('utf-8')
        self.assertIn('# Meeting Report', content)
        self.assertIn('Executive Architecture Review', content)
        self.assertIn('Target staging infrastructure deployment scheduled for Friday, November 6th.', content)
        self.assertIn('AWS GPU compute quota increases', content)

    # 9. Cascade deletion on meeting delete
    def test_cascade_delete_meeting(self):
        m_id = self.meeting.id
        response = self.client.delete(f'/api/meetings/{m_id}/')
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Meeting.objects.filter(id=m_id).exists())
        self.assertFalse(MeetingTask.objects.filter(meeting_id=m_id).exists())
        self.assertFalse(Decision.objects.filter(meeting_id=m_id).exists())
        self.assertFalse(Risk.objects.filter(meeting_id=m_id).exists())
        self.assertFalse(OpenQuestion.objects.filter(meeting_id=m_id).exists())

    # 10. Task filtering by meeting
    def test_task_filtering_by_meeting(self):
        other_meeting = Meeting.objects.create(title='Unrelated Sync', notes='Some text')
        MeetingTask.objects.create(meeting=other_meeting, title='Other task')

        response = self.client.get(f'/api/tasks/?meeting={self.meeting.id}')
        self.assertEqual(response.status_code, 200)
        results = response.json()
        task_list = results if isinstance(results, list) else results.get('results', [])
        # Both task_assigned and task_unassigned belong to self.meeting
        task_titles = [t['title'] for t in task_list]
        self.assertIn('Finalize Terraform IAM security policies', task_titles)
        self.assertNotIn('Other task', task_titles)
