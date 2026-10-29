import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('Project 2: Client Meeting-to-Action Tracker Frontend', () => {
  beforeEach(() => {
    // Mock fetch for health and meetings to prevent network errors in test env
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/health/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'ok', provider_configured: false }),
        });
      }
      if (url.includes('/meetings/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  // 1. Branding & Header
  it('renders Scalezix header branding and subtitle', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getAllByText(/SCALEZIX/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Client Meeting-to-Action Tracker/i).length).toBeGreaterThan(0);
  });

  // 2. Executive KPI Cards
  it('renders executive KPI summary metrics', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Total Meetings')).toBeDefined();
    expect(screen.getByText('Open Action Items')).toBeDefined();
    expect(screen.getByText('Overdue Tasks')).toBeDefined();
    expect(screen.getByText('Decisions Captured')).toBeDefined();
  });

  // 3. Zero-Hallucination Accuracy Rules: Unassigned Owner
  it('strictly displays "Unassigned — confirmation needed." when owner is missing', async () => {
    await act(async () => {
      render(<App />);
    });
    const unassignedBadges = screen.getAllByText('Unassigned — confirmation needed.');
    expect(unassignedBadges.length).toBeGreaterThan(0);
  });

  // 4. Zero-Hallucination Accuracy Rules: Missing Due Date
  it('strictly displays "No due date stated." when due date is missing', async () => {
    await act(async () => {
      render(<App />);
    });
    const noDueDateBadges = screen.getAllByText('No due date stated.');
    expect(noDueDateBadges.length).toBeGreaterThan(0);
  });

  // 5. Source Excerpt Preservation
  it('renders source note quotation for accountability', async () => {
    await act(async () => {
      render(<App />);
    });
    const sourceQuotes = screen.getAllByText(/Source note:/i);
    expect(sourceQuotes.length).toBeGreaterThan(0);
  });

  // 6. Action Buttons & Export Controls
  it('renders core action controls including Analyze and Export buttons', async () => {
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText('Analyze Meeting')).toBeDefined();
    expect(screen.getByText('Add Action Item')).toBeDefined();
    expect(screen.getByText('Export CSV')).toBeDefined();
    expect(screen.getByText('Report (.md)')).toBeDefined();
  });

  // 7. Interactive Edit Task Modal
  it('opens Edit Action Item modal when Edit button is clicked', async () => {
    await act(async () => {
      render(<App />);
    });
    const editButtons = screen.getAllByTitle('Edit Task');
    expect(editButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(editButtons[0]);
    });
    expect(screen.getByText('Edit Action Item')).toBeDefined();
    expect(screen.getByText('Update Action Item')).toBeDefined();
  });

  // 8. Dedicated New Meeting Page Navigation
  it('switches to dedicated New Meeting intake page when "+ Ingest New Meeting" is clicked', async () => {
    await act(async () => {
      render(<App />);
    });
    const newMeetingBtn = screen.getByText('+ Ingest New Meeting');
    await act(async () => {
      fireEvent.click(newMeetingBtn);
    });
    expect(screen.getByText('Create & Ingest New Meeting Record')).toBeDefined();
    expect(screen.getByText('Back to Meeting Dashboard')).toBeDefined();
  });
});
