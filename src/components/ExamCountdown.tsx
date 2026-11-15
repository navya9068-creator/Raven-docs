import React, { useState } from 'react';
import { Bell, CalendarClock, MapPin, Minus, Plus, Trash2, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { daysBetweenDateKeys, getTodayDateKey } from '../types/domain';

export const ExamCountdown: React.FC = () => {
  const { profile, subjects, exams, addExam, updateExam, deleteExam, updatePreferences } = useApp();
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [subjectTitle, setSubjectTitle] = useState(subjects[0]?.title || '');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return getTodayDateKey(d);
  });
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [totalUnits, setTotalUnits] = useState(8);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(45);
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  const todayKey = getTodayDateKey();

  const handleToggleNotifications = async () => {
    if (!profile) return;
    if (!profile.notificationsEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          setNotifStatus('Browser notifications were declined. In-app exam reminders remain active.');
          return;
        }
        new Notification('DARK ACADEMIA Reminders Active', {
          body: 'Upcoming examination countdown alerts are enabled.',
        });
      }
      await updatePreferences({ notificationsEnabled: true });
      setNotifStatus('Exam reminders enabled.');
    } else {
      await updatePreferences({ notificationsEnabled: false });
      setNotifStatus('Exam reminders paused.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const chosenSubj = subjects.find((s) => s.id === subjectId);
    await addExam({
      title,
      subjectId,
      subjectTitle: chosenSubj?.title || subjectTitle || 'General',
      examDate,
      location,
      notes,
      totalSyllabusUnits: totalUnits,
      completedSyllabusUnits: 0,
      dailyTargetMinutes,
    });
    setTitle('');
    setLocation('');
    setNotes('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--da-gold-bright)]">Exam Countdown</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
            Examinations & Syllabus Pacing
          </h1>
          <p className="text-sm text-[var(--da-muted)] mt-1">
            Monitor remaining days, syllabus unit coverage, and realistic daily revision targets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleToggleNotifications()}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs font-medium text-[var(--da-parchment)] px-3.5 py-2"
          >
            <Bell className="w-4 h-4 text-[var(--da-gold-bright)]" />
            <span>{profile?.notificationsEnabled ? 'Reminders On' : 'Enable Reminders'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSubjectId(subjects[0]?.id || '');
              setSubjectTitle(subjects[0]?.title || '');
              setShowModal(true);
            }}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Exam</span>
          </button>
        </div>
      </div>

      {notifStatus && (
        <div className="rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] px-4 py-3 text-xs text-[var(--da-parchment)]">
          {notifStatus}
        </div>
      )}

      {exams.length === 0 ? (
        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-10 text-center space-y-3">
          <CalendarClock className="w-8 h-8 text-[var(--da-muted)] mx-auto" />
          <p className="text-sm text-[var(--da-muted)]">No examinations scheduled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => {
            const daysLeft = daysBetweenDateKeys(todayKey, exam.examDate);
            const pct = Math.round((exam.completedSyllabusUnits / Math.max(1, exam.totalSyllabusUnits)) * 100);
            const remainingUnits = Math.max(0, exam.totalSyllabusUnits - exam.completedSyllabusUnits);
            const pacePerDay =
              daysLeft > 0 ? (remainingUnits / daysLeft).toFixed(1) : String(remainingUnits);

            return (
              <article
                key={exam.id}
                className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--da-gold-bright)]">{exam.subjectTitle}</p>
                    <h2 className="font-display text-2xl font-semibold text-[var(--da-ink)] truncate">
                      {exam.title}
                    </h2>
                    <p className="text-xs text-[var(--da-muted)] mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono-tabular">{exam.examDate}</span>
                      {exam.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {exam.location}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="font-mono-tabular text-xl font-semibold text-[var(--da-gold-bright)]">
                      {daysLeft < 0 ? 'Past' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                    </span>
                    <button
                      type="button"
                      onClick={() => void deleteExam(exam.id)}
                      aria-label={`Delete ${exam.title}`}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Syllabus Unit Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--da-muted)]">Syllabus Coverage ({pct}%)</span>
                    <span className="font-mono-tabular text-[var(--da-parchment)]">
                      {exam.completedSyllabusUnits} / {exam.totalSyllabusUnits} units
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--da-bg)] overflow-hidden">
                    <div className="h-full bg-[#B89872] transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-[var(--da-muted)] font-mono-tabular">
                      Target: {exam.dailyTargetMinutes}m/day · {pacePerDay} units/day
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={exam.completedSyllabusUnits <= 0}
                        onClick={() =>
                          void updateExam(exam.id, {
                            completedSyllabusUnits: Math.max(0, exam.completedSyllabusUnits - 1),
                          })
                        }
                        aria-label="Decrease completed units"
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-[var(--da-border)] flex items-center justify-center disabled:opacity-40"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={exam.completedSyllabusUnits >= exam.totalSyllabusUnits}
                        onClick={() =>
                          void updateExam(exam.id, {
                            completedSyllabusUnits: Math.min(exam.totalSyllabusUnits, exam.completedSyllabusUnits + 1),
                          })
                        }
                        aria-label="Increase completed units"
                        className="min-h-[36px] min-w-[36px] rounded-lg border border-[var(--da-border)] flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {exam.notes && (
                  <p className="text-xs text-[var(--da-muted)] border-t border-[var(--da-border)] pt-3 leading-relaxed">
                    {exam.notes}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="w-full max-w-md rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4 text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">Add Examination</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Examination Title</label>
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Final Jurisprudence Paper"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Subject</label>
              {subjects.length > 0 ? (
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    const s = subjects.find((item) => item.id === e.target.value);
                    if (s) setSubjectTitle(s.title);
                  }}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  maxLength={100}
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Exam Date</label>
                <input
                  required
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Syllabus Units</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Daily Revision (min)</label>
                <input
                  type="number"
                  min={10}
                  max={480}
                  value={dailyTargetMinutes}
                  onChange={(e) => setDailyTargetMinutes(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[var(--da-muted)]">Hall / Room</label>
                <input
                  maxLength={120}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Optional"
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Preparation Notes</label>
              <textarea
                rows={2}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-xs"
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
                Save Exam
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
