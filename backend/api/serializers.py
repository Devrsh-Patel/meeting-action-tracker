from rest_framework import serializers

from .models import Decision, Meeting, MeetingTask, OpenQuestion, Risk, AnalysisRun


class DecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Decision
        fields = '__all__'


class RiskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Risk
        fields = '__all__'


class OpenQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OpenQuestion
        fields = '__all__'


class MeetingTaskSerializer(serializers.ModelSerializer):
    due_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = MeetingTask
        fields = '__all__'


class AnalysisRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisRun
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):
    tasks = MeetingTaskSerializer(many=True, read_only=True)
    decisions = DecisionSerializer(many=True, read_only=True)
    risks = RiskSerializer(many=True, read_only=True)
    open_questions = OpenQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'client_name', 'meeting_date', 'participants', 'notes',
            'source_label', 'summary', 'analysis_status', 'review_status',
            'created_at', 'updated_at', 'tasks', 'decisions', 'risks', 'open_questions'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Meeting title is required.')
        return value.strip()

    def validate_notes(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Meeting notes are required for a new record unless manually created without analysis.')
        return value.strip()


class MeetingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['id', 'title', 'client_name', 'meeting_date', 'participants', 'notes', 'source_label', 'summary', 'analysis_status', 'review_status']

    def validate_title(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Meeting title is required.')
        return value

    def validate_notes(self, value):
        if value is not None:
            return value.strip()
        return value
