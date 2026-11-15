import React, { useMemo, useState } from 'react';
import { Award, BookOpen, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BADGE_DEFINITIONS, getRankForXp, getTodayDateKey } from '../types/domain';

export const ProgressVault: React.FC = () => {
  const { profile, subjects, chapters, focusSessions, quizAttempts, setShowPricingModal } = useApp();
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  if (!profile) return null;

  const isFree = profile.plan !== 'premium';
  const dayCount = range === '30d' && !isFree ? 30 : 7;

  const studySeries = useMemo(() => {
    return Array.from({ length: dayCount }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (dayCount - 1 - i));
      const key = getTodayDateKey(d);
      const mins = focusSessions
        .filter((s) => s.dateKey === key && s.mode !== 'short_break' && s.mode !== 'long_break')
        .reduce((acc, s) => acc + s.durationMinutes, 0);
      return {
        key,
        shortLabel: dayCount === 7 ? d.toLocaleDateString('en-US', { weekday: 'short' }) : String(d.getDate()),
        mins,
      };
    });
  }, [dayCount, focusSessions]);

  const maxMins = Math.max(profile.dailyGoalMinutes, ...studySeries.map((d) => d.mins), 60);
  const totalPeriodHours = (studySeries.reduce((a, b) => a + b.mins, 0) / 60).toFixed(1);

  const avgQuizScore = quizAttempts.length
    ? Math.round(quizAttempts.reduce((a, b) => a + b.score, 0) / quizAttempts.length)
    : 0;

  const rank = getRankForXp(profile.xp);

  const handleSelectRange = (next: '7d' | '30d') => {
    if (next === '30d' && isFree) {
      setShowPricingModal(true);
      return;
    }
    setRange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--da-gold-bright)]">Progress Vault</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
            Scholarly Analytics & Records
          </h1>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] self-start">
          <button
            type="button"
            onClick={() => handleSelectRange('7d')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-medium transition-colors ${
              range === '7d' ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]' : 'text-[var(--da-muted)]'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => handleSelectRange('30d')}
            className={`min-h-[38px] px-3.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
              range === '30d' ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <span>30 Days</span>
            {isFree && <Sparkles className="w-3 h-3 text-[var(--da-gold-bright)]" />}
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-1">
          <p className="text-xs text-[var(--da-muted)]">Period Study Hours</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-ink)]">{totalPeriodHours} hrs</p>
          <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">
            {(profile.totalStudyMinutes / 60).toFixed(1)} hrs lifetime
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-1">
          <p className="text-xs text-[var(--da-muted)]">Quiz Average</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-ink)]">{avgQuizScore}%</p>
          <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">{quizAttempts.length} trials taken</p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-1">
          <p className="text-xs text-[var(--da-muted)]">Active Study Days</p>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-ink)] flex items-center gap-2">
            <span>{profile.activeStudyDays}</span>
            <Flame className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </p>
          <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">Current streak: {profile.streakDays}d</p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 space-y-1">
          <p className="text-xs text-[var(--da-muted)]">Academic Rank</p>
          <p className="font-display text-2xl font-semibold text-[var(--da-parchment)]">{rank.title}</p>
          <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">{profile.xp} XP earned</p>
        </div>
      </section>

      {/* Study-Hour Chart */}
      <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
            Study-Hour Cadence ({dayCount} Days)
          </h2>
          <TrendingUp className="w-4 h-4 text-[var(--da-gold-bright)]" />
        </div>

        <div className="h-48 flex items-end gap-1.5 sm:gap-2 pt-4 border-b border-[var(--da-border)] pb-2 overflow-x-auto">
          {studySeries.map((day) => {
            const pct = Math.max(4, Math.round((day.mins / maxMins) * 100));
            return (
              <div key={day.key} className="flex-1 min-w-[16px] flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full max-w-[34px] h-36 flex items-end rounded-t bg-[var(--da-bg)]/50 overflow-hidden">
                  <div
                    title={`${day.key}: ${day.mins} min`}
                    className="w-full rounded-t bg-[#B89872]/85 transition-all duration-300"
                    style={{ height: `${day.mins > 0 ? pct : 3}%` }}
                  />
                </div>
                <span className="font-mono-tabular text-[10px] text-[var(--da-muted)]">{day.shortLabel}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subject Chapter Completion & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Subject Mastery</h2>
            <BookOpen className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-[var(--da-muted)]">Add subjects in Personal Library to track completion.</p>
          ) : (
            <div className="space-y-3">
              {subjects.map((s) => {
                const subChaps = chapters.filter((c) => c.subjectId === s.id);
                const done = subChaps.filter((c) => c.completed).length;
                const pct = subChaps.length ? Math.round((done / subChaps.length) * 100) : 0;
                return (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--da-ink)] truncate">{s.title}</span>
                      <span className="font-mono-tabular text-[var(--da-muted)]">
                        {done}/{subChaps.length} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--da-bg)] overflow-hidden">
                      <div className="h-full bg-[#80664B]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Earned Distinctions</h2>
            <Award className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {BADGE_DEFINITIONS.map((b) => {
              const unlocked = profile.unlockedBadges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border text-xs ${
                    unlocked
                      ? 'bg-[var(--da-walnut)]/40 border-[var(--da-gold)]/50 text-[var(--da-ink)]'
                      : 'bg-[var(--da-bg)]/40 border-[var(--da-border)] text-[var(--da-muted)] opacity-60'
                  }`}
                >
                  <p className="font-medium">{b.title}</p>
                  <p className="text-[11px] mt-0.5">{unlocked ? 'Unlocked' : b.criteria}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
