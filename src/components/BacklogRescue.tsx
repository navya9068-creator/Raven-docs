import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import {
  daysBetweenDateKeys,
  decodeSubtask,
  encodeSubtask,
  getTodayDateKey,
  type BacklogItem,
  type BacklogPriority,
} from '../types/domain';

export const BacklogRescue: React.FC = () => {
  const {
    profile,
    subjects,
    chapters,
    backlogItems,
    addBacklogItem,
    updateBacklogItem,
    deleteBacklogItem,
  } = useApp();

  const [tab, setTab] = useState<'pending' | 'completed' | 'schedule'>('pending');
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [subjectTitle, setSubjectTitle] = useState(subjects[0]?.title || 'General Study');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return getTodayDateKey(d);
  });
  const [priority, setPriority] = useState<BacklogPriority>('high');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [subtaskDraft, setSubtaskDraft] = useState(
    'Skim headings and core definitions\nWork through 3 practice problems\nWrite summary sheet'
  );

  const todayKey = getTodayDateKey();
  const isAdhd = Boolean(profile?.adhdMode);

  const pendingItems = useMemo(() => {
    const rankOrder: Record<BacklogPriority, number> = { critical: 0, high: 1, moderate: 2 };
    return backlogItems
      .filter((i) => !i.completed)
      .sort((a, b) => rankOrder[a.priority] - rankOrder[b.priority] || a.deadline.localeCompare(b.deadline));
  }, [backlogItems]);

  const completedItems = useMemo(() => backlogItems.filter((i) => i.completed), [backlogItems]);

  // Realistic Revision Schedule Generator: spreads remaining work evenly across available days before deadline
  const revisionSchedule = useMemo(() => {
    const dailyCap = profile?.dailyGoalMinutes || 90;
    const planDays: { dateKey: string; label: string; allocations: { title: string; subject: string; minutes: number }[]; totalMinutes: number }[] = [];

    for (let offset = 0; offset < 7; offset++) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const key = getTodayDateKey(d);
      planDays.push({
        dateKey: key,
        label: offset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        allocations: [],
        totalMinutes: 0,
      });
    }

    for (const item of pendingItems) {
      const subs = item.subtasks.map(decodeSubtask);
      const remainingRatio = subs.length
        ? subs.filter((s) => !s.done).length / subs.length
        : 1;
      let remainingMins = Math.max(15, Math.round(item.estimatedMinutes * remainingRatio));
      const daysUntilDeadline = Math.max(1, Math.min(7, daysBetweenDateKeys(todayKey, item.deadline) + 1));
      const perDaySlice = Math.max(15, Math.ceil(remainingMins / daysUntilDeadline));

      for (let dIdx = 0; dIdx < 7 && remainingMins > 0; dIdx++) {
        const day = planDays[dIdx];
        const roomLeft = Math.max(0, dailyCap - day.totalMinutes);
        const chunk = Math.min(remainingMins, perDaySlice, roomLeft > 0 ? roomLeft : perDaySlice);
        if (chunk > 0) {
          day.allocations.push({ title: item.title, subject: item.subjectTitle, minutes: chunk });
          day.totalMinutes += chunk;
          remainingMins -= chunk;
        }
      }
    }

    return planDays;
  }, [pendingItems, profile?.dailyGoalMinutes, todayKey]);

  const unfinishedLibraryChapters = chapters.filter(
    (ch) => !ch.completed && !backlogItems.some((b) => b.chapterId === ch.id && !b.completed)
  );

  const handleImportChapter = async (chapterId: string) => {
    const ch = chapters.find((c) => c.id === chapterId);
    if (!ch) return;
    const subj = subjects.find((s) => s.id === ch.subjectId);
    const d = new Date();
    d.setDate(d.getDate() + 4);
    await addBacklogItem({
      title: ch.title,
      subjectTitle: subj?.title || 'Personal Library',
      chapterId: ch.id,
      deadline: getTodayDateKey(d),
      priority: ch.isDifficult ? 'critical' : 'high',
      estimatedMinutes: ch.isDifficult ? 75 : 45,
      subtasks: [
        encodeSubtask({ done: false, label: 'Read chapter & highlight core definitions' }),
        encodeSubtask({ done: false, label: 'Summarize key formulas or arguments' }),
        encodeSubtask({ done: false, label: 'Solve review questions' }),
      ],
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const subtasks = subtaskDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((label) => encodeSubtask({ done: false, label }));

    await addBacklogItem({
      title,
      subjectTitle: subjectTitle.trim() || 'General Study',
      chapterId: '',
      deadline,
      priority,
      estimatedMinutes,
      subtasks,
    });
    setTitle('');
    setShowModal(false);
  };

  const toggleSubtask = async (item: BacklogItem, idx: number) => {
    const subs = item.subtasks.map(decodeSubtask);
    if (!subs[idx]) return;
    subs[idx] = { ...subs[idx], done: !subs[idx].done };
    const encoded = subs.map(encodeSubtask);
    const allDone = subs.length > 0 && subs.every((s) => s.done);
    await updateBacklogItem(item.id, { subtasks: encoded, completed: allDone });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--da-gold-bright)]">Backlog Rescue</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
            Recover Unfinished Chapters
          </h1>
          <p className="text-sm text-[var(--da-muted)] mt-1">
            {isAdhd
              ? 'Break unfinished chapters into gentle, bite-sized steps with zero guilt.'
              : 'Assign deadlines, set priorities, and build a realistic daily revision cadence.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2.5 text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Backlog Chapter</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] max-w-md">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors ${
            tab === 'pending' ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]' : 'text-[var(--da-muted)]'
          }`}
        >
          Pending ({pendingItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('schedule')}
          className={`flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors ${
            tab === 'schedule' ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]' : 'text-[var(--da-muted)]'
          }`}
        >
          Revision Plan
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`flex-1 min-h-[40px] rounded-lg text-xs font-medium transition-colors ${
            tab === 'completed' ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]' : 'text-[var(--da-muted)]'
          }`}
        >
          Rescued ({completedItems.length})
        </button>
      </div>

      {/* Quick import unfinished chapters from Library */}
      {tab === 'pending' && unfinishedLibraryChapters.length > 0 && (
        <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-2.5">
          <p className="text-xs text-[var(--da-muted)] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5 text-[var(--da-gold-bright)]" />
            <span>Import unfinished chapters from Personal Library:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {unfinishedLibraryChapters.slice(0, 4).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => void handleImportChapter(ch.id)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs text-[var(--da-parchment)] transition-colors"
              >
                + {ch.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {tab === 'schedule' ? (
        <section className="space-y-3">
          <p className="text-xs text-[var(--da-muted)]">
            Automatically balanced against your {profile?.dailyGoalMinutes || 90} min/day study capacity across the next 7 days.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {revisionSchedule.map((day) => (
              <div
                key={day.dateKey}
                className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[var(--da-border)] pb-2">
                  <span className="text-sm font-medium text-[var(--da-parchment)]">{day.label}</span>
                  <span className="font-mono-tabular text-xs text-[var(--da-gold-bright)]">
                    {day.totalMinutes} min
                  </span>
                </div>
                {day.allocations.length === 0 ? (
                  <p className="text-xs text-[var(--da-muted)] py-2">Open buffer for review or rest.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {day.allocations.map((alloc, i) => (
                      <li key={i} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[var(--da-ink)] truncate">{alloc.title}</p>
                          <p className="text-[11px] text-[var(--da-muted)] truncate">{alloc.subject}</p>
                        </div>
                        <span className="font-mono-tabular text-[var(--da-gold-bright)] shrink-0">{alloc.minutes}m</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          {(tab === 'pending' ? pendingItems : completedItems).length === 0 ? (
            <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-10 text-center text-sm text-[var(--da-muted)]">
              {tab === 'pending' ? 'No pending backlog items. Your archive is caught up.' : 'No rescued items completed yet.'}
            </div>
          ) : (
            (tab === 'pending' ? pendingItems : completedItems).map((item) => {
              const subs = item.subtasks.map(decodeSubtask);
              const daysLeft = daysBetweenDateKeys(todayKey, item.deadline);
              const doneSubs = subs.filter((s) => s.done).length;
              return (
                <article
                  key={item.id}
                  className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void updateBacklogItem(item.id, { completed: !item.completed })}
                      className="flex items-start gap-3 text-left flex-1 min-w-0"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--da-gold-bright)] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--da-muted)] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 space-y-1">
                        <h3 className={`text-base font-medium ${item.completed ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-ink)]'}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-[var(--da-muted)] flex flex-wrap items-center gap-2">
                          <span>{item.subjectTitle}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">Priority: {item.priority}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {isAdhd
                              ? `Target ${item.deadline}`
                              : daysLeft < 0
                              ? `${Math.abs(daysLeft)}d past target`
                              : daysLeft === 0
                              ? 'Due today'
                              : `${daysLeft}d remaining`}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">{item.estimatedMinutes}m est.</span>
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteBacklogItem(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {subs.length > 0 && (
                    <div className="pl-8 space-y-2 border-t border-[var(--da-border)] pt-3">
                      <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">
                        Micro-tasks ({doneSubs}/{subs.length})
                      </p>
                      <div className="space-y-1.5">
                        {subs.map((st, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => void toggleSubtask(item, idx)}
                            className="w-full min-h-[36px] text-left flex items-center gap-2.5 text-xs py-1"
                          >
                            {st.done ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-[var(--da-muted)] shrink-0" />
                            )}
                            <span className={st.done ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-parchment)]'}>
                              {st.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="w-full max-w-lg rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4 text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">Add Backlog Chapter</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Chapter or Topic Title</label>
              <input
                required
                maxLength={140}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 6: Organic Stereochemistry"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Subject</label>
                <input
                  required
                  maxLength={100}
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Target Deadline</label>
                <input
                  required
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as BacklogPriority)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="moderate">Moderate</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Estimated Minutes</label>
                <input
                  type="number"
                  min={10}
                  max={1200}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Break Into Micro-Tasks (one per line)</label>
              <textarea
                rows={3}
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-xs leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--da-border)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
              >
                Save to Rescue Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
