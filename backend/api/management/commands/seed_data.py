import datetime
from django.core.management.base import BaseCommand
from api.models import Meeting, MeetingTask, Decision, Risk, OpenQuestion


class Command(BaseCommand):
    help = 'Seeds realistic Scalezix client meeting records and action items'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Clearing existing meeting records...'))
        Meeting.objects.all().delete()

        # -------------------------------------------------------------
        # 1. Novacare Health Systems - Architecture & Security Review
        # -------------------------------------------------------------
        m1 = Meeting.objects.create(
            title='Q3 Enterprise Architecture & Security Review',
            client_name='Novacare Health Systems',
            meeting_date=datetime.date(2026, 10, 28),
            participants='Dr. Marcus Vance, Sarah Connor, Alex Rivera',
            source_label='Zoom Transcript - Oct 28',
            notes="""Alex Rivera: Thanks for joining everyone. Today we need to align on the AWS HIPAA staging deployment for Novacare.
Dr. Vance: Yes, our primary blocker is the legal compliance sign-off. Has the Business Associate Agreement (BAA) been routed?
Sarah Connor: I will send the Scalezix HIPAA BAA document for legal sign-off by this Friday, November 2nd.
Alex Rivera: Great. On my end, I will finalize the Terraform IAM security policies by November 4th so we have least-privilege roles for the RDS cluster.
Dr. Vance: What about the pricing tier review for the enterprise seat allocation?
Sarah Connor: We discussed that, but we did not assign anyone to handle the pricing matrix or set a deadline yet. Let's make sure that's flagged.
Alex Rivera: Agreed. We also confirmed that the target staging infrastructure deployment is scheduled for Friday, November 6th.
Dr. Vance: One major risk: AWS GPU compute quota increases could delay the LLM medical summary pipeline if not approved in time.
Sarah Connor: Also, external legal counsel review could take up to 14 days for the BAA.""",
            summary='The team aligned on the AWS HIPAA staging migration. Terraform templates and BAA agreements are critical path items for the November 6th kickoff.',
            analysis_status='analyzed',
            review_status='needs_review',
        )

        MeetingTask.objects.create(
            meeting=m1,
            title='Finalize Terraform IAM security policies',
            description='Ensure least-privilege roles for staging ECS and RDS clusters.',
            owner='Alex Rivera',
            due_date=datetime.date(2026, 11, 4),
            status='in_progress',
            priority='high',
            review_state='confirmed',
            is_ai_generated=True,
            source_excerpt='Alex Rivera will finalize the Terraform IAM security policies by November 4th.',
        )

        MeetingTask.objects.create(
            meeting=m1,
            title='Send Scalezix HIPAA BAA document for legal sign-off',
            description='Compliance requirement before staging data ingress.',
            owner='Sarah Connor',
            due_date=datetime.date(2026, 11, 2),
            status='todo',
            priority='high',
            review_state='confirmed',
            is_ai_generated=True,
            source_excerpt='Sarah Connor will send the Scalezix HIPAA BAA document for legal sign-off by this Friday, November 2nd.',
        )

        MeetingTask.objects.create(
            meeting=m1,
            title='Review pricing tier and customer seat allocation',
            description='Analyze enterprise seat licensing model with finance team.',
            owner=None,  # Rule 2: Unassigned — confirmation needed.
            due_date=None,  # Rule 3: No due date stated.
            status='todo',
            priority='medium',
            review_state='needs_review',
            is_ai_generated=True,
            uncertainty_notes='No owner or deadline was stated in the meeting. Flagged for review.',
            source_excerpt='We discussed that, but we did not assign anyone to handle the pricing matrix or set a deadline yet.',
        )

        Decision.objects.create(
            meeting=m1,
            text='Target staging infrastructure deployment scheduled for Friday, November 6th.',
            source_excerpt='We also confirmed that the target staging infrastructure deployment is scheduled for Friday, November 6th.',
            review_state='confirmed',
            is_ai_generated=True,
        )

        Decision.objects.create(
            meeting=m1,
            text='PostgreSQL 16 selected as default managed RDS engine.',
            source_excerpt='PostgreSQL 16 will be used across all HIPAA compliant database instances.',
            review_state='needs_review',
            is_ai_generated=True,
        )

        Risk.objects.create(
            meeting=m1,
            text='AWS GPU compute quota increases could delay LLM pipeline deployment if unapproved.',
            review_state='needs_review',
            is_ai_generated=True,
        )

        Risk.objects.create(
            meeting=m1,
            text='External legal counsel review delay up to 14 days for enterprise BAA.',
            review_state='needs_review',
            is_ai_generated=True,
        )

        OpenQuestion.objects.create(
            meeting=m1,
            text='Need confirmation: Is multi-region failover required for pilot phase?',
            response_status='open',
            is_ai_generated=True,
        )

        # -------------------------------------------------------------
        # 2. Apex Global Retail - Launch Sync
        # -------------------------------------------------------------
        m2 = Meeting.objects.create(
            title='Apex Commerce Platform Integration Sync',
            client_name='Apex Global Retail',
            meeting_date=datetime.date(2026, 10, 27),
            participants='Elena Rostova, David Chen, Maya Lin',
            source_label='Google Meet Audio Notes',
            notes="""Elena: We need to finalize the webhook ingestion pipeline before the peak holiday sale.
David: I will implement the Webhook idempotency keys for Shopify order ingestion by November 10th.
Maya: Who is benchmarking Redis cache eviction latency under 10k RPS load?
Elena: We did not pick an owner or timeline for Redis benchmarking yet. Let's make sure that's flagged for confirmation.
David: We decided that webhooks will retry with exponential backoff up to 72 hours before dead-letter queueing.
Maya: Risk: Black Friday traffic surge could overload unindexed legacy product catalog tables.""",
            summary='Ingestion pipeline architecture alignment for holiday peak traffic. Idempotency guarantees finalized.',
            analysis_status='analyzed',
            review_status='confirmed',
        )

        MeetingTask.objects.create(
            meeting=m2,
            title='Implement Webhook idempotency keys for Shopify order ingestion',
            description='Prevent duplicate order events and invoice creation.',
            owner='David Chen',
            due_date=datetime.date(2026, 11, 10),
            status='in_progress',
            priority='high',
            review_state='confirmed',
            is_ai_generated=True,
            source_excerpt='David: I will implement the Webhook idempotency keys for Shopify order ingestion by November 10th.',
        )

        MeetingTask.objects.create(
            meeting=m2,
            title='Benchmark Redis cache eviction latency under 10k RPS load',
            description='Stress-test distributed cache memory pressure.',
            owner=None,
            due_date=None,
            status='todo',
            priority='medium',
            review_state='needs_review',
            is_ai_generated=True,
            uncertainty_notes='Redis benchmarking owner and timeline unassigned in meeting.',
            source_excerpt="Elena: We did not pick an owner or timeline for Redis benchmarking yet.",
        )

        Decision.objects.create(
            meeting=m2,
            text='Webhooks will retry with exponential backoff up to 72 hours before dead-letter queueing.',
            source_excerpt='David: We decided that webhooks will retry with exponential backoff up to 72 hours before dead-letter queueing.',
            review_state='confirmed',
            is_ai_generated=True,
        )

        Risk.objects.create(
            meeting=m2,
            text='Black Friday traffic surge could overload unindexed legacy product catalog tables.',
            review_state='needs_review',
            is_ai_generated=True,
        )

        self.stdout.write(self.style.SUCCESS(
            f'Successfully seeded {Meeting.objects.count()} meetings and {MeetingTask.objects.count()} tasks!'
        ))

