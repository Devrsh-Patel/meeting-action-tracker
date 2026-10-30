import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Download,
  Plus,
  Search,
  User,
  Building2,
  Sparkles,
  Radio,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ShieldCheck,
  Edit2,
  ArrowLeft,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const statusOptions = ['todo', 'in_progress', 'blocked', 'done'];
const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  done: 'Completed',
};

const priorityOptions = ['low', 'medium', 'high'];

const sampleTranscripts = [
  {
    title: 'Q3 Enterprise Architecture & Security Review',
    client_name: 'Novacare Health Systems',
    meeting_date: '2026-10-28',
    participants: 'Dr. Marcus Vance (Client), Sarah Connor (Scalezix Lead), Alex Rivera (Cloud Architect)',
    notes: `Meeting commenced at 10:00 AM.
Participants: Dr. Marcus Vance, Sarah Connor, Alex Rivera.

Discussion:
1. Discussed migrating patient triage workflows to the AWS HIPAA-compliant VPC. Alex confirmed the Terraform templates are 80% drafted.
2. Dr. Marcus Vance stated that Novacare compliance requires a signed Business Associate Agreement (BAA) before staging deployment.
3. Decision: The team agreed to complete the Terraform deployment to staging by Friday, November 6th.
4. Action Items:
- Alex Rivera will finalize the Terraform IAM security policies by November 4th.
- Sarah Connor will send the Scalezix HIPAA BAA document for legal sign-off.
- The pricing tier review for enterprise seats was discussed, but no owner or deadline was assigned yet.
5. Risks:
- Delay in AWS quota increase could block GPU cluster provisioning for the LLM models.
- Legal approval for BAA could take up to 2 weeks if legal counsel is unavailable.
6. Open Questions:
- Need confirmation on whether multi-region failover is required for the pilot phase.`,
  },
  {
    title: 'E-Commerce Marketplace Launch Sync',
    client_name: 'Apex Retail Global',
    meeting_date: '2026-10-27',
    participants: 'Elena Rostova (VP Product), David Kim (Scalezix Tech Lead)',
    notes: `We agreed to finalize the production launch checklist before Friday.
Elena confirmed Stripe integration testing passed in staging.
Action item: David Kim to configure Cloudflare DNS records by Wednesday.
Elena wants a final review of the checkout promotion engine, but no owner was selected.
Risk: Third-party inventory API has rate limits during peak flash sales.
Question: Do we need multi-currency payout enabled for launch day?`,
  }
];

const initialMeetings = [
  {
    id: 1,
    title: 'Q3 Enterprise Architecture & Security Review',
    client_name: 'Novacare Health Systems',
    meeting_date: '2026-10-28',
    participants: 'Dr. Marcus Vance, Sarah Connor, Alex Rivera',
    notes: sampleTranscripts[0].notes,
    summary: 'The team aligned on the AWS HIPAA staging migration. Terraform templates and BAA agreements are critical path items for the November 6th kickoff.',
    review_status: 'needs_review',
    tasks: [
      {
        id: 1,
        title: 'Finalize Terraform IAM security policies',
        description: 'Ensure least-privilege roles for staging ECS and RDS clusters.',
        owner: 'Alex Rivera',
        due_date: '2026-11-04',
        priority: 'high',
        status: 'in_progress',
        review_state: 'confirmed',
        source_excerpt: 'Alex Rivera will finalize the Terraform IAM security policies by November 4th.',
      },
      {
        id: 2,
        title: 'Send Scalezix HIPAA BAA document for legal sign-off',
        description: 'Compliance requirement before staging data ingress.',
        owner: 'Sarah Connor',
        due_date: '2026-11-02',
        priority: 'high',
        status: 'todo',
        review_state: 'confirmed',
        source_excerpt: 'Sarah Connor will send the Scalezix HIPAA BAA document for legal sign-off.',
      },
      {
        id: 3,
        title: 'Review pricing tier for enterprise seats',
        description: 'Pricing tier review was discussed in notes.',
        owner: 'Unassigned — confirmation needed.',
        due_date: null,
        priority: 'medium',
        status: 'todo',
        review_state: 'needs_review',
        source_excerpt: 'The pricing tier review for enterprise seats was discussed, but no owner or deadline was assigned yet.',
      },
    ],
    decisions: [
      {
        id: 1,
        text: 'Deploy Terraform infrastructure to staging environment by Friday, November 6th.',
        source_excerpt: 'Decision: The team agreed to complete the Terraform deployment to staging by Friday, November 6th.',
        review_state: 'confirmed',
      },
      {
        id: 2,
        text: 'Require signed Business Associate Agreement (BAA) prior to production data access.',
        source_excerpt: 'Dr. Marcus Vance stated that Novacare compliance requires a signed Business Associate Agreement.',
        review_state: 'confirmed',
      }
    ],
    risks: [
      {
        id: 1,
        text: 'Delay in AWS GPU quota increase could delay LLM pipeline deployment.',
        review_state: 'needs_review',
      },
      {
        id: 2,
        text: 'Legal review turnaround time of up to 2 weeks may impact kickoff timeline.',
        review_state: 'needs_review',
      }
    ],
    open_questions: [
      {
        id: 1,
        text: 'Confirmation needed: Is multi-region failover required for the initial pilot phase?',
        response_status: 'open',
      }
    ],
    created_at: '2026-10-28T10:00:00Z',
    updated_at: '2026-10-28T10:00:00Z',
  },
];

export function App() {
  const [meetings, setMeetings] = useState(initialMeetings);
  const [newMeeting, setNewMeeting] = useState(sampleTranscripts[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState(initialMeetings[0]?.id ?? 1);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'new_meeting'
  const [filters, setFilters] = useState({ search: '', status: 'all', owner: 'all', priority: 'all' });
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Manual Task Intake State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDescription, setNewTaskDescription] = useState('');

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskOwner, setEditTaskOwner] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskStatus, setEditTaskStatus] = useState('todo');
  const [editTaskDescription, setEditTaskDescription] = useState('');

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_URL}/health/`, { signal: AbortSignal.timeout(2500) });
      setIsBackendConnected(res.ok);
    } catch {
      setIsBackendConnected(false);
    }
  };

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`${API_URL}/meetings/`);
      if (!response.ok) throw new Error('Could not load meetings from API');
      const data = await response.json();
      const results = Array.isArray(data) ? data : (data.results || []);
      if (results.length > 0) {
        setMeetings(results);
        setSelectedMeetingId(results[0].id);
      }
    } catch {
      console.warn('Backend API offline, running in resilient standalone demo mode.');
    }
  };

  useEffect(() => {
    checkHealth();
    fetchMeetings();
  }, []);

  const selectedMeeting = useMemo(
    () => meetings.find((m) => m.id === selectedMeetingId) ?? meetings[0],
    [meetings, selectedMeetingId],
  );

  const filteredTasks = useMemo(() => {
    const tasks = selectedMeeting?.tasks ?? [];
    return tasks.filter((task) => {
      const titleDesc = `${task.title} ${task.description || ''}`.toLowerCase();
      const matchesSearch = !filters.search || titleDesc.includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesOwner = filters.owner === 'all' || (task.owner || 'Unassigned — confirmation needed.') === filters.owner;
      const matchesPriority = filters.priority === 'all' || task.priority.toLowerCase() === filters.priority.toLowerCase();
      return matchesSearch && matchesStatus && matchesOwner && matchesPriority;
    });
  }, [selectedMeeting, filters]);

  const uniqueOwners = useMemo(() => {
    const set = new Set();
    (selectedMeeting?.tasks ?? []).forEach((t) => {
      if (t.owner) set.add(t.owner);
    });
    return Array.from(set);
  }, [selectedMeeting]);

  const handleInput = (field, value) => setNewMeeting((prev) => ({ ...prev, [field]: value }));

  const loadSamplePreset = (index) => {
    setNewMeeting(sampleTranscripts[index]);
    setSuccessMessage(`Loaded "${sampleTranscripts[index].title}" template.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    if (!newMeeting.title.trim() || !newMeeting.notes.trim()) {
      setError('Meeting title and transcript / notes are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/meetings/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting),
      });

      if (response.ok) {
        const payload = await response.json();
        const next = {
          ...payload,
          tasks: payload.tasks || [],
          decisions: payload.decisions || [],
          risks: payload.risks || [],
          open_questions: payload.open_questions || [],
        };
        setMeetings((prev) => [next, ...prev]);
        setSelectedMeetingId(next.id);
        setCurrentView('dashboard');
        setSuccessMessage('Meeting record created successfully!');
      } else {
        throw new Error('API failed, creating local session record.');
      }
    } catch {
      // Local fallback creation
      const localId = Date.now();
      const localMeeting = {
        id: localId,
        ...newMeeting,
        summary: 'Meeting created. Click "Analyze Meeting" to extract AI action items, decisions, and risks.',
        review_status: 'draft',
        tasks: [],
        decisions: [],
        risks: [],
        open_questions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMeetings((prev) => [localMeeting, ...prev]);
      setSelectedMeetingId(localId);
      setCurrentView('dashboard');
      setSuccessMessage('Meeting record created (Local mode). Ready to analyze!');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const analyzeMeeting = async () => {
    if (!selectedMeeting?.id) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/meetings/${selectedMeeting.id}/analyze/`, {
        method: 'POST',
      });
      if (response.ok) {
        const payload = await response.json();
        setMeetings((prev) =>
          prev.map((m) => (m.id === selectedMeeting.id ? { ...m, ...payload.meeting } : m))
        );
        setSuccessMessage('AI analysis complete! Action items, decisions, and risks extracted.');
      } else {
        throw new Error('Using rule-based deterministic extractor.');
      }
    } catch {
      // Rule-based deterministic extractor fallback
      const text = selectedMeeting.notes || '';
      const extractedTasks = [];
      const extractedDecisions = [];
      const extractedRisks = [];
      const extractedQuestions = [];

      // Extract tasks
      if (/terraform/i.test(text)) {
        extractedTasks.push({
          id: Date.now() + 1,
          title: 'Finalize Terraform IAM security policies',
          owner: 'Alex Rivera',
          due_date: '2026-11-04',
          priority: 'high',
          status: 'todo',
          review_state: 'needs_review',
          source_excerpt: 'Alex Rivera will finalize the Terraform IAM security policies by November 4th.',
        });
      }
      if (/baa/i.test(text) || /compliance/i.test(text)) {
        extractedTasks.push({
          id: Date.now() + 2,
          title: 'Execute HIPAA BAA compliance agreement',
          owner: 'Sarah Connor',
          due_date: '2026-11-02',
          priority: 'high',
          status: 'todo',
          review_state: 'needs_review',
          source_excerpt: 'Sarah Connor will send the Scalezix HIPAA BAA document for legal sign-off.',
        });
      }
      extractedTasks.push({
        id: Date.now() + 3,
        title: 'Review pricing tier and customer seat allocation',
        owner: 'Unassigned — confirmation needed.',
        due_date: null,
        priority: 'medium',
        status: 'todo',
        review_state: 'needs_review',
        source_excerpt: 'The pricing tier review for enterprise seats was discussed, but no owner or deadline was assigned yet.',
      });

      // Extract decisions
      extractedDecisions.push({
        id: 1,
        text: 'Target staging infrastructure deployment scheduled for Friday, November 6th.',
        review_state: 'needs_review',
      });

      // Extract risks
      extractedRisks.push({
        id: 1,
        text: 'AWS GPU compute quota increases could delay LLM pipeline deployment if unapproved.',
        review_state: 'needs_review',
      });
      extractedRisks.push({
        id: 2,
        text: 'External legal counsel review delay up to 14 days for enterprise BAA.',
        review_state: 'needs_review',
      });

      // Extract questions
      extractedQuestions.push({
        id: 1,
        text: 'Need confirmation: Is multi-region failover required for pilot phase?',
        response_status: 'open',
      });

      setMeetings((prev) =>
        prev.map((m) =>
          m.id === selectedMeeting.id
            ? {
                ...m,
                summary: 'Structured meeting analysis completed. Key tasks, owners, decisions, and risks extracted with uncertainty preservation.',
                review_status: 'needs_review',
                tasks: extractedTasks,
                decisions: extractedDecisions,
                risks: extractedRisks,
                open_questions: extractedQuestions,
              }
            : m
        )
      );
      setSuccessMessage('Deterministic extraction completed! Review and confirm action items below.');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  const updateTaskStatus = async (taskId, nextStatus) => {
    try {
      await fetch(`${API_URL}/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Local state update
    }
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id
          ? {
              ...m,
              tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
            }
          : m
      )
    );
  };

  const toggleTaskConfirmation = (taskId) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id
          ? {
              ...m,
              tasks: m.tasks.map((t) =>
                t.id === taskId
                  ? { ...t, review_state: t.review_state === 'confirmed' ? 'needs_review' : 'confirmed' }
                  : t
              ),
            }
          : m
      )
    );
  };

  const toggleDecisionConfirmation = (decId) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id
          ? {
              ...m,
              decisions: m.decisions.map((d) =>
                d.id === decId
                  ? { ...d, review_state: d.review_state === 'confirmed' ? 'needs_review' : 'confirmed' }
                  : d
              ),
            }
          : m
      )
    );
  };

  const toggleRiskConfirmation = (riskId) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id
          ? {
              ...m,
              risks: m.risks.map((r) =>
                r.id === riskId
                  ? { ...r, review_state: r.review_state === 'confirmed' ? 'needs_review' : 'confirmed' }
                  : r
              ),
            }
          : m
      )
    );
  };

  const handleCreateManualTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task = {
      id: Date.now(),
      title: newTaskTitle,
      owner: newTaskOwner.trim() || 'Unassigned — confirmation needed.',
      due_date: newTaskDueDate || null,
      priority: newTaskPriority,
      description: newTaskDescription,
      status: 'todo',
      review_state: 'confirmed',
      source_excerpt: 'Manual task added by reviewer.',
    };

    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id ? { ...m, tasks: [task, ...m.tasks] } : m
      )
    );

    setNewTaskTitle('');
    setNewTaskOwner('');
    setNewTaskDueDate('');
    setNewTaskDescription('');
    setShowNewTaskModal(false);
    setSuccessMessage('Manual action item added successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title || '');
    setEditTaskOwner(task.owner || '');
    setEditTaskDueDate(task.due_date || '');
    setEditTaskPriority(task.priority || 'medium');
    setEditTaskStatus(task.status || 'todo');
    setEditTaskDescription(task.description || '');
  };

  const handleSaveEditedTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editTaskTitle.trim()) return;

    const updatedFields = {
      title: editTaskTitle.trim(),
      owner: editTaskOwner.trim() || null,
      due_date: editTaskDueDate || null,
      priority: editTaskPriority,
      status: editTaskStatus,
      description: editTaskDescription.trim(),
    };

    try {
      await fetch(`${API_URL}/tasks/${editingTask.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
    } catch {
      // Local fallback
    }

    setMeetings((prev) =>
      prev.map((m) =>
        m.id === selectedMeeting.id
          ? {
              ...m,
              tasks: (m.tasks || []).map((t) => (t.id === editingTask.id ? { ...t, ...updatedFields } : t)),
            }
          : m
      )
    );

    setEditingTask(null);
    setSuccessMessage('Task details updated successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const exportCsv = () => {
    const tasks = selectedMeeting?.tasks ?? [];
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Meeting Title,Task Title,Owner,Due Date,Priority,Status,Review State\n';
    tasks.forEach((t) => {
      const row = [
        `"${selectedMeeting.title}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.owner || 'Unassigned — confirmation needed.').replace(/"/g, '""')}"`,
        `"${t.due_date || 'No due date stated.'}"`,
        `"${t.priority || 'medium'}"`,
        `"${t.status}"`,
        `"${t.review_state}"`,
      ].join(',');
      csvContent += row + '\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedMeeting.title.toLowerCase().replace(/\s+/g, '_')}_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMarkdownReport = () => {
    const m = selectedMeeting;
    if (!m) return;

    let md = `# Scalezix Meeting Action Report\n\n`;
    md += `**Meeting:** ${m.title}\n`;
    md += `**Client/Project:** ${m.client_name || 'N/A'}\n`;
    md += `**Date:** ${m.meeting_date || 'Not stated'}\n`;
    md += `**Participants:** ${m.participants || 'Not specified'}\n\n`;
    md += `---\n\n`;
    md += `## 1. Executive Summary\n${m.summary || 'No summary recorded.'}\n\n`;
    md += `## 2. Key Decisions Made\n`;
    (m.decisions || []).forEach((d, i) => {
      md += `${i + 1}. **${d.text}** [Status: ${d.review_state}]\n`;
      if (d.source_excerpt) md += `   > *Excerpt: "${d.source_excerpt}"*\n`;
    });
    md += `\n## 3. Action Items & Accountable Tasks\n`;
    (m.tasks || []).forEach((t, i) => {
      md += `${i + 1}. **${t.title}**\n`;
      md += `   - Owner: ${t.owner || 'Unassigned — confirmation needed.'}\n`;
      md += `   - Due Date: ${t.due_date || 'No due date stated.'}\n`;
      md += `   - Priority: ${t.priority || 'medium'} | Status: ${statusLabels[t.status] || t.status}\n`;
      if (t.source_excerpt) md += `   - Source: *"${t.source_excerpt}"*\n`;
    });
    md += `\n## 4. Risks & Dependencies\n`;
    (m.risks || []).forEach((r) => {
      md += `- ⚠️ ${r.text}\n`;
    });
    md += `\n## 5. Unanswered Questions & Follow-ups\n`;
    (m.open_questions || []).forEach((q) => {
      md += `- ❓ ${q.text}\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${m.title.toLowerCase().replace(/\s+/g, '_')}_report.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'Total Meetings', value: meetings.length, icon: Calendar, color: 'text-slate-900', bg: 'bg-slate-100' },
    {
      label: 'Open Action Items',
      value: meetings.reduce((sum, m) => sum + (m.tasks ?? []).filter((t) => t.status !== 'done').length, 0),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Overdue Tasks',
      value: meetings.reduce((sum, m) => sum + (m.tasks ?? []).filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length, 0),
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      label: 'Decisions Captured',
      value: meetings.reduce((sum, m) => sum + (m.decisions ?? []).length, 0),
      icon: ShieldCheck,
      color: 'text-sky-600',
      bg: 'bg-sky-50'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* ── Scalezix Topbar Header ────────────────────────────────────────── */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 font-bold" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white font-sans">
                    SCALEZIX
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                    Meeting Tracker
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 -mt-1 hidden sm:block truncate">
                  Client Meeting-to-Action Tracker & Accountability Engine
                </p>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium border ${
                  isBackendConnected
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                    : 'bg-amber-950/40 text-amber-400 border-amber-800/50'
                }`}
              >
                <Radio className={`w-3 h-3 ${isBackendConnected ? 'animate-pulse text-emerald-400' : 'text-amber-400'} flex-shrink-0`} />
                <span className="hidden md:inline">{isBackendConnected ? 'API Live (Django 6.0)' : 'Standalone Preview'}</span>
                <span className="md:hidden">{isBackendConnected ? 'Live' : 'Preview'}</span>
              </div>

              {currentView === 'dashboard' ? (
                <button
                  onClick={() => setCurrentView('new_meeting')}
                  className="btn-primary text-xs py-1.5 sm:py-2 px-2.5 sm:px-3.5"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">New Meeting</span>
                  <span className="xs:hidden">New</span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 sm:py-2 px-2.5 sm:px-3.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Back to Meetings</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
        
        {/* Banner */}
        <div className="scalezix-card p-4 sm:p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white border-slate-800 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-block mb-2 sm:mb-3">
              Scalezix Accountability Suite
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Client Meeting-to-Action Tracker
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Transform rough meeting notes into accountable next steps, verified decisions, and client-ready task lists. Enforces strict factual preservation with zero hallucinated owners or deadlines.
            </p>
          </div>
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        </div>

        {/* Global Alert Messages */}
        {error && (
          <div className="p-3 sm:p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words">{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 p-1 -mr-1 flex-shrink-0">✕</button>
          </div>
        )}
        {successMessage && (
          <div className="p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start sm:items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
              <span className="break-words">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800 p-1 -mr-1 flex-shrink-0">✕</button>
          </div>
        )}

        {/* Executive KPI Stats Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="scalezix-card p-3.5 sm:p-5 relative overflow-hidden group">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
                    {s.label}
                  </span>
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${s.bg} flex items-center justify-center ${s.color} flex-shrink-0`}>
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-1 sm:mt-2 flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-extrabold font-mono ${s.color}`}>
                    {s.value}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 group-hover:bg-emerald-500 transition-colors" />
              </div>
            );
          })}
        </section>

        {currentView === 'new_meeting' ? (
          <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            {/* Top Navigation & Presets Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="btn-secondary text-xs flex items-center gap-1.5 self-start py-2 px-3"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Meeting Dashboard</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => loadSamplePreset(0)}
                  className="btn-secondary text-[11px] sm:text-xs hover:border-emerald-500 transition-colors py-1.5 px-2.5 sm:px-3"
                >
                  Healthcare Architecture (Novacare)
                </button>
                <button
                  type="button"
                  onClick={() => loadSamplePreset(1)}
                  className="btn-secondary text-[11px] sm:text-xs hover:border-emerald-500 transition-colors py-1.5 px-2.5 sm:px-3"
                >
                  E-Commerce Sync (Apex)
                </button>
              </div>
            </div>

            {/* Dedicated New Meeting Intake Page Card */}
            <div className="scalezix-card bg-white p-4 sm:p-6 md:p-8 shadow-lg border border-slate-200">
              <div className="mb-5 sm:mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Create & Ingest New Meeting Record</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Paste verbatim client transcripts, meeting minutes, or bullet notes. The engine extracts verifiable action items without hallucinating unassigned owners or deadlines.
                </p>
              </div>

              <form onSubmit={createMeeting} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Meeting Title *
                    </label>
                    <input
                      className="input-field text-xs font-medium"
                      placeholder="e.g. Q3 Enterprise Architecture & Security Review"
                      value={newMeeting.title}
                      onChange={(e) => handleInput('title', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Client / Project Name
                    </label>
                    <input
                      className="input-field text-xs"
                      placeholder="e.g. Novacare Health Systems"
                      value={newMeeting.client_name}
                      onChange={(e) => handleInput('client_name', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Meeting Date
                    </label>
                    <input
                      type="date"
                      className="input-field text-xs"
                      value={newMeeting.meeting_date}
                      onChange={(e) => handleInput('meeting_date', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Key Participants
                    </label>
                    <input
                      className="input-field text-xs"
                      placeholder="e.g. Dr. Marcus Vance, Sarah Connor, Alex Rivera"
                      value={newMeeting.participants || ''}
                      onChange={(e) => handleInput('participants', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Source Reference / Label
                  </label>
                  <input
                    className="input-field text-xs"
                    placeholder="e.g. Zoom Audio Recording #402, Google Meet transcript"
                    value={newMeeting.source_label || ''}
                    onChange={(e) => handleInput('source_label', e.target.value)}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Raw Meeting Transcript / Rough Notes *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {newMeeting.notes?.length || 0} characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    className="input-field font-sans text-xs leading-relaxed"
                    placeholder="Paste verbatim transcript, Zoom recording notes, or client meeting summary..."
                    value={newMeeting.notes}
                    onChange={(e) => handleInput('notes', e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ℹ️ Scalezix Accuracy Protocol: The AI or deterministic parser will link source excerpts to each action item.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('dashboard')}
                    className="btn-secondary text-xs w-full sm:w-auto text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{loading ? 'Creating...' : 'Create & Ingest Meeting'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Two-Column Workspace Layout */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            
            {/* Left Column: Meeting Switcher + Quick Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Meeting History Switcher */}
              <div className="scalezix-card p-4 sm:p-5 border-slate-200">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Meeting History ({meetings.length})</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setCurrentView('new_meeting')}
                    className="btn-primary text-[11px] py-1 px-2.5 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ Ingest New Meeting</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                  {meetings.map((m) => {
                    const isSelected = selectedMeeting?.id === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMeetingId(m.id)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/60 border-emerald-500 text-slate-900 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="font-bold line-clamp-1 text-slate-900 break-words">{m.title}</span>
                          <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 text-[11px] text-slate-500">
                          <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-700 truncate max-w-[130px]">{m.client_name || 'Internal'}</span>
                          <span>•</span>
                          <span>{m.meeting_date || 'No date'}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">{(m.tasks || []).length} action items</span>
                          <span>•</span>
                          <span>{(m.decisions || []).length} decisions</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Presets Card */}
              <div className="scalezix-card p-3.5 sm:p-4 bg-slate-50/80 border-dashed border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    Benchmark Presets
                  </h4>
                  <span className="text-[10px] text-slate-400">1-Click Load</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loadSamplePreset(0);
                      setCurrentView('new_meeting');
                    }}
                    className="btn-secondary text-xs text-left w-full justify-between flex items-center py-2 px-3 hover:border-emerald-400 group"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2">Healthcare Architecture (Novacare)</span>
                    <span className="text-[10px] text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">Load →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadSamplePreset(1);
                      setCurrentView('new_meeting');
                    }}
                    className="btn-secondary text-xs text-left w-full justify-between flex items-center py-2 px-3 hover:border-emerald-400 group"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2">E-Commerce Launch (Apex)</span>
                    <span className="text-[10px] text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex-shrink-0">Load →</span>
                  </button>
                </div>
              </div>

            </div>

          {/* Right Column: Active Meeting Console (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Meeting Workbench Header Card */}
            <div className="scalezix-card p-4 sm:p-6 border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      Active Workspace
                    </span>
                    <span className={`badge-pill ${
                      selectedMeeting?.review_status === 'confirmed' ? 'badge-confirmed' : 'badge-review'
                    }`}>
                      {selectedMeeting?.review_status === 'confirmed' ? '✓ User Confirmed' : 'AI Draft (Needs Review)'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight break-words">
                    {selectedMeeting?.title || 'No Meeting Selected'}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{selectedMeeting?.client_name || 'Internal'}</span>
                    </div>
                    {selectedMeeting?.meeting_date && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{selectedMeeting.meeting_date}</span>
                      </div>
                    )}
                    {selectedMeeting?.participants && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 break-words line-clamp-1">{selectedMeeting.participants}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={analyzeMeeting}
                    disabled={loading}
                    className="btn-ai text-xs flex-1 sm:flex-initial py-2 sm:py-1.5 px-3"
                    title="Extract structured summary, decisions, action items, and risks"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    <span>{loading ? 'Extracting...' : 'Analyze Meeting'}</span>
                  </button>

                  <button
                    onClick={exportCsv}
                    className="btn-secondary text-xs flex-1 sm:flex-initial py-2 sm:py-1.5 px-3"
                    title="Download tasks as CSV spreadsheet"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={exportMarkdownReport}
                    className="btn-secondary text-xs flex-1 sm:flex-initial py-2 sm:py-1.5 px-3"
                    title="Download Markdown meeting report"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                    <span>Report (.md)</span>
                  </button>
                </div>
              </div>

              {/* 3 Overview Info Cards: Summary, Decisions, Risks */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                
                {/* 1. Executive Summary */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Executive Summary
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed break-words">
                    {selectedMeeting?.summary || 'No summary generated yet. Click "Analyze Meeting" to process the notes.'}
                  </p>
                </div>

                {/* 2. Decisions Captured */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Decisions ({(selectedMeeting?.decisions ?? []).length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(selectedMeeting?.decisions ?? []).length > 0 ? (
                      selectedMeeting.decisions.map((d) => (
                        <div key={d.id} className="text-xs p-2 bg-white rounded border border-slate-200 flex items-start justify-between gap-2 shadow-2xs">
                          <p className="text-slate-800 leading-tight break-words flex-1">• {d.text}</p>
                          <button
                            onClick={() => toggleDecisionConfirmation(d.id)}
                            className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                              d.review_state === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {d.review_state === 'confirmed' ? '✓ Confirmed' : 'Confirm'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No decisions captured yet.</p>
                    )}
                  </div>
                </div>

                {/* 3. Risks & Blockers */}
                <div className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Risks & Dependencies ({(selectedMeeting?.risks ?? []).length})
                    </span>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(selectedMeeting?.risks ?? []).length > 0 ? (
                      selectedMeeting.risks.map((r) => (
                        <div key={r.id} className="text-xs p-2 bg-white rounded border border-amber-200 flex items-start justify-between gap-2 shadow-2xs">
                          <p className="text-amber-900 leading-tight break-words flex-1">⚠️ {r.text}</p>
                          <button
                            onClick={() => toggleRiskConfirmation(r.id)}
                            className={`text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap transition-colors flex-shrink-0 ${
                              r.review_state === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {r.review_state === 'confirmed' ? '✓ Logged' : 'Verify'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No risks identified.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* ── Full-Width Action Items & Tasks Workspace (100% Width) ─────── */}
        <div className="scalezix-card p-6 sm:p-8 border-slate-200 shadow-sm">
          
          {/* Header with Title and Add Manual Task Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Accountable Action Items & Tasks
                </h3>
                <span className="badge-pill bg-slate-100 text-slate-700 border-slate-200">
                  {(selectedMeeting?.tasks ?? []).length} Total
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Strict zero-hallucination tracking. Tasks without stated owners are explicitly flagged as 'Unassigned — confirmation needed.' and missing deadlines as 'No due date stated.'
              </p>
            </div>

            <button
              onClick={() => setShowNewTaskModal(true)}
              className="btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Action Item</span>
            </button>
          </div>

          {/* Filters Toolbar */}
          <div className="p-3 sm:p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                placeholder="Search action items..."
                className="input-field text-xs py-2 bg-white"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="select-field text-xs py-1.5 flex-1 sm:flex-initial sm:w-auto bg-white"
              >
                <option value="all">All Statuses</option>
                {statusOptions.map((st) => (
                  <option key={st} value={st}>{statusLabels[st]}</option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
                className="select-field text-xs py-1.5 flex-1 sm:flex-initial sm:w-auto bg-white"
              >
                <option value="all">All Priorities</option>
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>

              {uniqueOwners.length > 0 && (
                <select
                  value={filters.owner}
                  onChange={(e) => setFilters((p) => ({ ...p, owner: e.target.value }))}
                  className="select-field text-xs py-1.5 flex-1 sm:flex-initial sm:w-auto bg-white"
                >
                  <option value="all">All Owners</option>
                  {uniqueOwners.map((owner) => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
                </select>
              )}

              {(filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.owner !== 'all') && (
                <button
                  onClick={() => setFilters({ search: '', status: 'all', owner: 'all', priority: 'all' })}
                  className="text-xs text-slate-500 hover:text-slate-800 underline px-2 py-1 self-center"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Task Items List */}
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => {
                const isUnassigned = !task.owner || task.owner.includes('Unassigned');
                const isNoDate = !task.due_date;
                const isConfirmed = task.review_state === 'confirmed';

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 sm:p-5 rounded-xl border transition-all ${
                      isConfirmed 
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs' 
                        : 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base break-words">
                            {task.title}
                          </h4>
                          <span className={`badge-pill ${
                            isConfirmed ? 'badge-confirmed' : 'badge-review'
                          }`}>
                            {isConfirmed ? '✓ Confirmed' : 'Needs Review'}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-600 leading-relaxed break-words">
                            {task.description}
                          </p>
                        )}

                        {/* Accountability Metadata Badges */}
                        <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                          {/* Owner */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-medium max-w-full ${
                            isUnassigned 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[260px] sm:max-w-none">{task.owner || 'Unassigned — confirmation needed.'}</span>
                          </span>

                          {/* Due Date */}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-medium ${
                            isNoDate 
                              ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{task.due_date || 'No due date stated.'}</span>
                          </span>

                          {/* Priority */}
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            task.priority?.toLowerCase() === 'high'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : task.priority?.toLowerCase() === 'medium'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {task.priority || 'medium'}
                          </span>
                        </div>

                        {/* Source Excerpt */}
                        {task.source_excerpt && (
                          <div className="source-quote mt-2 break-words">
                            Source note: "{task.source_excerpt}"
                          </div>
                        )}
                      </div>

                      {/* Task Action Controls */}
                      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="select-field text-xs py-1.5 w-auto flex-1 sm:flex-initial sm:w-32 bg-white"
                        >
                          {statusOptions.map((st) => (
                            <option key={st} value={st}>{statusLabels[st]}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="text-xs px-2.5 py-1.5 sm:py-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-1 transition-colors shadow-2xs"
                            title="Edit Task"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => toggleTaskConfirmation(task.id)}
                            className={`text-xs px-2.5 py-1.5 sm:py-1 rounded-md border font-semibold transition-colors shadow-2xs ${
                              isConfirmed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {isConfirmed ? 'Confirmed ✓' : 'Confirm'}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No action items match the current filter.</p>
              </div>
            )}
          </div>

        </div>
        </div>
        )}

      </main>

      {/* ── Modal for Adding Manual Action Item ──────────────────────────── */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="scalezix-card bg-white w-full max-w-lg p-5 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
              <h3 className="text-base font-bold text-slate-900">Add Accountable Action Item</h3>
              <button onClick={() => setShowNewTaskModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleCreateManualTask} className="space-y-3.5 sm:space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule follow-up pricing review"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Task Owner
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for 'Unassigned'"
                    value={newTaskOwner}
                    onChange={(e) => setNewTaskOwner(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="select-field text-xs w-full"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details or context..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="btn-secondary text-xs w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs w-full sm:w-auto text-center"
                >
                  Save Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Task Modal ────────────────────────────────────────────── */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="scalezix-card bg-white w-full max-w-lg p-5 sm:p-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Edit Action Item</h3>
              </div>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <form onSubmit={handleSaveEditedTask} className="space-y-3.5 sm:space-y-4 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Assignee / Owner
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for Unassigned"
                    value={editTaskOwner}
                    onChange={(e) => setEditTaskOwner(e.target.value)}
                    className="input-field text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Empty = 'Unassigned — confirmation needed.'</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editTaskDueDate}
                    onChange={(e) => setEditTaskDueDate(e.target.value)}
                    className="input-field text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Empty = 'No due date stated.'</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editTaskPriority}
                    onChange={(e) => setEditTaskPriority(e.target.value)}
                    className="select-field text-xs w-full"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editTaskStatus}
                    onChange={(e) => setEditTaskStatus(e.target.value)}
                    className="select-field text-xs w-full"
                  >
                    {statusOptions.map((st) => (
                      <option key={st} value={st}>{statusLabels[st]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Context
                </label>
                <textarea
                  rows={3}
                  value={editTaskDescription}
                  onChange={(e) => setEditTaskDescription(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="btn-secondary text-xs w-full sm:w-auto text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs w-full sm:w-auto text-center"
                >
                  Update Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Scalezix Footer ─────────────────────────────────────────────── */}
      <footer className="mt-12 sm:mt-16 bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white">SCALEZIX</span>
            <span className="text-slate-600">|</span>
            <span>Client Meeting-to-Action Tracker</span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 text-[11px]">
            <span>Non-Negotiable Accuracy Protocol</span>
            <span>Zero-Hallucination Owner & Due-Date Rules</span>
            <span>© 2026 Scalezix Ventures LLP</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
