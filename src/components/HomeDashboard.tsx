import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Coffee,
  Feather,
  Flame,
  Sparkles,
} from 'lucide-react';
import heroSanctumImg from '../assets/images/hero_study_sanctum_1794719607206.jpg';
import { useApp } from '../contexts/AppContext';
import { daysBetweenDateKeys, decodeSubtask, getRankForXp, getTodayDateKey } from '../types/domain';

export const HomeDashboard: React.FC = () => {
  const {
    profile,
    chapters,
    focusSessions,
    missions,
    backlogItems,
    exams,
    setActiveSection,
    claimMission,
    updatePreferences,
  } = useApp();

  if (!profile) return null;

  const todayKey = getTodayDateKey();
  const rank = getRankForXp(profile.xp);
  const nextRankXp = rank.nextXp;
  const xpIntoRank = profile.xp - rank.minXp;
  const xpSpan = nextRankXp ? nextRankXp - rank.minXp : 1;
  const rankPct = nextRankXp ? Math.min(100, Math.round((xpIntoRank / xpSpan) * 100)) : 100;

  const todayMinutes = focusSessions
    .filter((s) => s.dateKey === todayKey && s.mode !== 'short_break' && s.mode !== 'long_break')
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, profile.dailyGoalMinutes)) * 100));

  const completedChaptersCount = chapters.filter((c) => c.completed).length;
  const totalChaptersCount = chapters.length;
  const todayMissions = missions.filter((m) => m.type === 'daily' && m.id.endsWith(todayKey));
  const customMissions = missions.filter((m) => m.type === 'custom' && !m.completed);

  // Build 7-day productivity chart from real focusSessions
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = getTodayDateKey(d);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const mins = focusSessions
      .filter((s) => s.dateKey === key && s.mode !== 'short_break' && s.mode !== 'long_break')
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    return { key, label, mins };
  });
  const maxDayMins = Math.max(profile.dailyGoalMinutes, ...last7Days.map((d) => d.mins), 60);

  const upcomingExams = exams
    .map((e) => ({ ...e, daysLeft: daysBetweenDateKeys(todayKey, e.examDate) }))
    .filter((e) => e.daysLeft >= 0)
    .slice(0, 3);

  // Determine single next achievable micro-step for ADHD-Friendly Mode
  const pendingBacklog = backlogItems.find((b) => !b.completed);
  const nextMicroSubtask = pendingBacklog
    ? pendingBacklog.subtasks.map(decodeSubtask).find((st) => !st.done)
    : null;
  const nextIncompleteChapter = chapters.find((c) => !c.completed);

  if (profile.adhdMode) {
    const singleTaskTitle = nextMicroSubtask
      ? nextMicroSubtask.label
      : pendingBacklog
      ? pendingBacklog.title
      : nextIncompleteChapter
      ? nextIncompleteChapter.title
      : 'Take a 10-minute gentle reading sprint';

    const singleTaskContext = pendingBacklog
      ? pendingBacklog.subjectTitle
      : nextIncompleteChapter
      ? 'Personal Library'
      : 'Focus Room';

    return (
      <div className="max-w-2xl mx-auto space-y-6 py-2">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--da-border)] pb-4">
          <div>
            <p className="text-xs text-[var(--da-gold-bright)] flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5" />
              <span>ADHD-Friendly Calm View · Zero Penalty</span>
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)] mt-1">
              Welcome back, {profile.displayName}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void updatePreferences({ adhdMode: false })}
            className="min-h-[40px] px-3.5 rounded-lg border border-[var(--da-border)] text-xs text-[var(--da-muted)] hover:text-[var(--da-ink)] whitespace-nowrap"
          >
            Standard View
          </button>
        </div>

        {/* One Task at a Time Focus Card */}
        <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-gold)]/40 p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-[var(--da-muted)]">One Task at a Time · {singleTaskContext}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--da-parchment)]">
              {singleTaskTitle}
            </h2>
          </div>

          <p className="text-sm text-[var(--da-muted)] leading-relaxed">
            You only need to begin for 10 or 15 minutes. Missed days are never punished here—every session you start adds to your {profile.activeStudyDays} total active study days.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveSection('focus')}
              className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-5 py-3 text-sm font-medium transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Start 15-Min Micro-Sprint</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection(pendingBacklog ? 'backlog' : 'library')}
              className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-[var(--da-parchment)] px-5 py-3 text-sm font-medium transition-colors"
            >
              <span>Open Task List</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Gentle Goal & Break Reminder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-2">
            <p className="text-xs text-[var(--da-muted)]">Gentle Daily Progress</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-parchment)]">
              {todayMinutes} <span className="text-sm font-normal text-[var(--da-muted)]">/ {profile.dailyGoalMinutes} min</span>
            </p>
            <div className="h-2 rounded-full bg-[var(--da-bg)] overflow-hidden">
              <div
                className="h-full bg-[#B89872] transition-all duration-300"
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-2">
            <p className="text-xs text-[var(--da-muted)] flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[var(--da-gold-bright)]" />
              <span>Gentle Care Reminder</span>
            </p>
            <p className="text-sm text-[var(--da-parchment)] leading-relaxed">
              Drink a glass of water, unclench your shoulders, and rest your eyes after your sprint.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Sanctum Header */}
      <section className="relative rounded-2xl overflow-hidden border border-[var(--da-border)] bg-[var(--da-surface)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <p className="text-xs text-[var(--da-gold-bright)]">
                Rank {rank.roman} · {rank.title} · <span className="font-mono-tabular">{profile.xp} XP</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)] leading-tight">
                Welcome to the Sanctum, {profile.displayName}
              </h1>
              <p className="text-sm text-[var(--da-muted)]">
                Discipline is the architecture of knowledge. Today’s goal is{' '}
                <span className="font-mono-tabular text-[var(--da-parchment)]">{profile.dailyGoalMinutes} minutes</span>.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--da-muted)]">
                <span>Daily Study Goal ({goalPct}%)</span>
                <span className="font-mono-tabular text-[var(--da-parchment)]">
                  {todayMinutes} / {profile.dailyGoalMinutes} min
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--da-bg)] overflow-hidden">
                <div
                  className="h-full bg-[#B89872] transition-all duration-300"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--da-muted)] pt-1">
                <span>Rank Progression ({rankPct}%)</span>
                <span className="font-mono-tabular">
                  {nextRankXp ? `${profile.xp} / ${nextRankXp} XP` : 'Maximum Rank Attained'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setActiveSection('focus')}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-5 py-2.5 text-sm font-medium transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Enter Focus Room</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('backlog')}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-[var(--da-parchment)] px-4 py-2.5 text-sm font-medium transition-colors"
              >
                <span>Rescue Backlog</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full">
            <img
              src={heroSanctumImg}
              alt="Atmospheric library desk"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-transparent via-[var(--da-surface)]/30 to-[var(--da-surface)]" />
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--da-muted)]">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-parchment)]">
            {(profile.totalStudyMinutes / 60).toFixed(1)} hrs
          </p>
          <p className="text-xs text-[var(--da-muted)] font-mono-tabular">{todayMinutes} min logged today</p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--da-muted)]">
            <span>Daily Streak</span>
            <Flame className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-parchment)]">
            {profile.streakDays} {profile.streakDays === 1 ? 'day' : 'days'}
          </p>
          <p className="text-xs text-[var(--da-muted)] font-mono-tabular">{profile.activeStudyDays} active days total</p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--da-muted)]">
            <span>Completed Chapters</span>
            <BookOpen className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          <p className="font-mono-tabular text-2xl font-semibold text-[var(--da-parchment)]">
            {completedChaptersCount} / {totalChaptersCount}
          </p>
          <p className="text-xs text-[var(--da-muted)]">Across Personal Library</p>
        </div>

        <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--da-muted)]">
            <span>Academic Rank</span>
            <Award className="w-4 h-4 text-[var(--da-gold-bright)]" />
          </div>
          <p className="font-display text-2xl font-semibold text-[var(--da-parchment)] truncate">
            {rank.title}
          </p>
          <p className="text-xs text-[var(--da-muted)] font-mono-tabular">{profile.xp} XP · {profile.unlockedBadges.length} badges</p>
        </div>
      </section>

      {/* Main Grid: Weekly Chart + Upcoming Exams + Daily Missions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Productivity Chart */}
        <section className="lg:col-span-7 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
                Weekly Study Cadence
              </h2>
              <p className="text-xs text-[var(--da-muted)]">
                Focus minutes recorded over the last 7 days
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('vault')}
              className="min-h-[40px] text-xs text-[var(--da-gold-bright)] hover:underline underline-offset-4 whitespace-nowrap"
            >
              Open Progress Vault
            </button>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-4 border-b border-[var(--da-border)] pb-2">
            {last7Days.map((day) => {
              const heightPct = Math.max(4, Math.round((day.mins / maxDayMins) * 100));
              const isToday = day.key === todayKey;
              return (
                <div key={day.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="font-mono-tabular text-[11px] text-[var(--da-muted)]">
                    {day.mins > 0 ? `${day.mins}m` : '0'}
                  </span>
                  <div className="w-full max-w-[38px] h-32 flex items-end rounded-t-md bg-[var(--da-bg)]/50 overflow-hidden">
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isToday ? 'bg-[#B89872]' : 'bg-[#80664B]/75'
                      }`}
                      style={{ height: `${day.mins > 0 ? heightPct : 4}%` }}
                    />
                  </div>
                  <span className={`text-xs ${isToday ? 'text-[var(--da-ink)] font-medium' : 'text-[var(--da-muted)]'}`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Examinations */}
        <section className="lg:col-span-5 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
              Upcoming Examinations
            </h2>
            <button
              type="button"
              onClick={() => setActiveSection('exams')}
              className="min-h-[40px] text-xs text-[var(--da-gold-bright)] hover:underline underline-offset-4 whitespace-nowrap"
            >
              Manage All
            </button>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <CalendarClock className="w-8 h-8 text-[var(--da-muted)] mx-auto" />
              <p className="text-sm text-[var(--da-muted)]">No upcoming examinations scheduled.</p>
              <button
                type="button"
                onClick={() => setActiveSection('exams')}
                className="min-h-[40px] px-4 rounded-lg border border-[var(--da-border)] text-xs text-[var(--da-parchment)] hover:border-[var(--da-gold)]"
              >
                Add Exam Date
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[var(--da-border)]">
              {upcomingExams.map((exam) => {
                const pct = Math.round((exam.completedSyllabusUnits / Math.max(1, exam.totalSyllabusUnits)) * 100);
                return (
                  <div key={exam.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--da-ink)] truncate">{exam.title}</p>
                        <p className="text-xs text-[var(--da-muted)] truncate">
                          {exam.subjectTitle} · {exam.examDate}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs font-semibold text-[var(--da-gold-bright)] whitespace-nowrap shrink-0">
                        {exam.daysLeft === 0 ? 'Today' : `${exam.daysLeft}d left`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--da-bg)] overflow-hidden">
                        <div className="h-full bg-[#80664B]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono-tabular text-[11px] text-[var(--da-muted)]">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Daily Missions */}
      <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
              Today’s Academic Missions
            </h2>
            <p className="text-xs text-[var(--da-muted)]">
              Each daily mission grants XP once per calendar day to preserve scholarly integrity
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection('missions')}
            className="min-h-[40px] text-xs text-[var(--da-gold-bright)] hover:underline underline-offset-4 whitespace-nowrap"
          >
            Mission Board
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...todayMissions, ...customMissions.slice(0, 2)].map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={m.xpAwarded}
              onClick={() => void claimMission(m)}
              className={`min-h-[64px] text-left p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                m.xpAwarded
                  ? 'bg-[var(--da-bg)]/40 border-[var(--da-border)] opacity-75 cursor-default'
                  : 'bg-[var(--da-bg)]/70 border-[var(--da-border)] hover:border-[var(--da-gold)]'
              }`}
            >
              {m.xpAwarded ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--da-gold-bright)] shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-[var(--da-muted)] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium truncate ${m.xpAwarded ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-ink)]'}`}>
                    {m.title}
                  </p>
                  <span className="font-mono-tabular text-xs text-[var(--da-gold-bright)] whitespace-nowrap shrink-0">
                    +{m.xpReward} XP
                  </span>
                </div>
                <p className="text-xs text-[var(--da-muted)] mt-0.5 line-clamp-1">{m.description}</p>
              </div>
            </button>
          ))}
        </div>

        {profile.plan !== 'premium' && (
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-[var(--da-border)] text-xs text-[var(--da-muted)]">
            <span>Free Plan Active · Core Focus, Library (15 noted chapters) & Daily Missions</span>
            <button
              type="button"
              onClick={() => setActiveSection('profile')}
              className="inline-flex items-center gap-1 text-[var(--da-gold-bright)] hover:underline whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>View Plans</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
