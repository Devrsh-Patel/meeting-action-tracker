import json
import os
from datetime import date

from django.conf import settings
from django.core.exceptions import ValidationError
from openai import OpenAI


class AIService:
    @staticmethod
    def is_configured():
        return bool(os.getenv('OPENAI_API_KEY') or os.getenv('AI_API_KEY'))

    @staticmethod
    def _normalize_optional(value):
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    @staticmethod
    def _parse_date(value):
        if not value:
            return None
        if isinstance(value, date):
            return value
        try:
            from datetime import datetime
            return datetime.fromisoformat(str(value)).date()
        except ValueError:
            return None

    @classmethod
    def _deterministic_extract(cls, text):
        import re
        raw_chunks = re.split(r'[\r\r\n]+|(?<=[.!?])\s+', text)
        sentences = []
        for chunk in raw_chunks:
            chunk = chunk.strip()
            if not chunk:
                continue
            clean = re.sub(r'^[\-\*•\d+\.]+\s*', '', chunk).strip()
            if clean:
                sentences.append(clean)

        action_items = []
        decisions = []
        risks = []
        open_questions = []
        discussion_points = []

        for s in sentences:
            s_lower = s.lower()
            if any(s_lower.startswith(k) or f' {k}' in s_lower for k in ['decision:', 'decided', 'agreed that', 'agreed on', 'approved']):
                dec_text = re.sub(r'^(decision|agreed|approved)[:\s\-]+', '', s, flags=re.IGNORECASE).strip()
                decisions.append({'text': dec_text or s, 'source_excerpt': s})
            elif any(s_lower.startswith(k) or f' {k}' in s_lower for k in ['risk:', 'blocker:', 'concern:', 'threat:', 'might delay', 'may delay']):
                risk_text = re.sub(r'^(risk|blocker|concern)[:\s\-]+', '', s, flags=re.IGNORECASE).strip()
                risks.append({'text': risk_text or s})
            elif s.endswith('?') or any(s_lower.startswith(k) for k in ['question:', 'open question:', 'tbd:']):
                q_text = re.sub(r'^(question|open question|tbd)[:\s\-]+', '', s, flags=re.IGNORECASE).strip()
                open_questions.append({'text': q_text or s})
            elif any(k in s_lower for k in ['will', 'must', 'action:', 'todo:', 'task:', 'to deliver', 'to review', 'to complete', 'needs to']):
                owner = None
                owner_match = re.match(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:will|must|is to|needs to)\s+(.+)', s)
                if owner_match:
                    owner = owner_match.group(1)
                    title = owner_match.group(2)
                else:
                    colon_match = re.match(r'^([A-Z][a-z]+(?:\s[A-Z][a-z]+)?):\s*(.+)', s)
                    if colon_match and not any(colon_match.group(1).lower().startswith(x) for x in ['decision', 'risk', 'action', 'note', 'update']):
                        owner = colon_match.group(1)
                        title = colon_match.group(2)
                    else:
                        title = re.sub(r'^(action|todo|task)[:\s\-]+', '', s, flags=re.IGNORECASE).strip()

                title = title[:120].strip()
                priority = 'high' if any(w in s_lower for w in ['urgent', 'critical', 'asap', 'high priority']) else 'medium'
                action_items.append({
                    'title': title or 'Action item',
                    'description': s,
                    'owner': owner,
                    'due_date': None,
                    'priority': priority,
                    'source_excerpt': s,
                    'uncertainty_notes': '' if owner else 'Owner not explicitly designated.'
                })
            else:
                discussion_points.append(s)

        if not action_items and sentences:
            action_items.append({
                'title': sentences[0][:80],
                'description': sentences[0],
                'owner': None,
                'due_date': None,
                'priority': 'medium',
                'source_excerpt': sentences[0],
                'uncertainty_notes': 'Auto-extracted from notes context.'
            })

        summary_text = ' '.join(sentences[:2]) if sentences else 'Meeting analyzed successfully.'
        summary = f'Summary: {summary_text}'

        return {
            'summary': summary,
            'discussion_points': discussion_points[:10],
            'decisions': decisions,
            'action_items': action_items,
            'risks': risks,
            'dependencies': [],
            'open_questions': open_questions,
            'needs_confirmation': [item['title'] for item in action_items if not item.get('owner')],
        }

    @classmethod
    def analyze_meeting_text(cls, text):
        if not cls.is_configured():
            return cls._deterministic_extract(text)

        try:
            client = OpenAI(api_key=os.getenv('OPENAI_API_KEY') or os.getenv('AI_API_KEY'), timeout=20.0)
        except Exception as exc:  # pragma: no cover - depends on runtime client config
            raise ValidationError(f'AI configuration error: {exc}') from exc

        prompt = f"You are extracting structured meeting data. Follow strict rules. Never invent owners, due dates, decisions, or commitments. If unknown, use null and add a note in uncertainty_notes. Return valid JSON only.\r\n\r\nMeeting notes:\r\n{text[:40000]}"

        try:
            response = client.responses.create(
                model='gpt-4o-mini',
                input=[
                    {
                        'role': 'system',
                        'content': 'You extract meeting outputs and never invent facts. Return valid JSON with explicit nulls and uncertainty notes.'
                    },
                    {'role': 'user', 'content': prompt}
                ],
                temperature=0.2,
            )
            content = response.output_text
            payload = json.loads(content)
        except Exception as exc:  # pragma: no cover - external API may fail
            raise ValidationError('The AI response could not be parsed. Please review the meeting notes and save a manual summary.') from exc

        # Strictly sanitize the payload to avoid malformed data.
        summary = cls._normalize_optional(payload.get('summary')) or 'No summary available.'
        discussion_points = payload.get('discussion_points') or []
        decisions = payload.get('decisions') or []
        action_items = payload.get('action_items') or []
        risks = payload.get('risks') or []
        dependencies = payload.get('dependencies') or []
        open_questions = payload.get('open_questions') or []
        needs_confirmation = payload.get('needs_confirmation') or []

        normalized = {
            'summary': summary,
            'discussion_points': [cls._normalize_optional(item) for item in discussion_points if cls._normalize_optional(item)],
            'decisions': [
                {'text': cls._normalize_optional(item.get('text')) or 'Decision was not captured clearly.', 'source_excerpt': cls._normalize_optional(item.get('source_excerpt'))}
                for item in decisions if isinstance(item, dict)
            ],
            'action_items': [
                {
                    'title': cls._normalize_optional(item.get('title')) or 'Untitled task',
                    'description': cls._normalize_optional(item.get('description')) or '',
                    'owner': cls._normalize_optional(item.get('owner')),
                    'due_date': cls._parse_date(item.get('due_date')),
                    'priority': (cls._normalize_optional(item.get('priority')) or 'Medium').lower(),
                    'source_excerpt': cls._normalize_optional(item.get('source_excerpt')) or '',
                    'uncertainty_notes': cls._normalize_optional(item.get('uncertainty_notes')) or '',
                }
                for item in action_items if isinstance(item, dict)
            ],
            'risks': [{'text': cls._normalize_optional(item.get('text')) or 'Risk was not captured clearly.'} for item in risks if isinstance(item, dict)],
            'dependencies': [{'text': cls._normalize_optional(item.get('text')) or 'Dependency was not captured clearly.'} for item in dependencies if isinstance(item, dict)],
            'open_questions': [{'text': cls._normalize_optional(item.get('text')) or 'Question was not captured clearly.'} for item in open_questions if isinstance(item, dict)],
            'needs_confirmation': [cls._normalize_optional(item) for item in needs_confirmation if cls._normalize_optional(item)],
        }
        return normalized
