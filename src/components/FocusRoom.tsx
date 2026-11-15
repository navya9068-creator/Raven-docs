import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { ambientAudio } from '../lib/ambientAudio';
import { getTodayDateKey, type AmbientSoundType, type FocusModeType } from '../types/domain';

interface PresetOption {
  id: FocusModeType;
  label: string;
  minutes: number;
}

const PRESETS: PresetOption[] = [
  { id: 'pomodoro', label: 'Pomodoro (25m)', minutes: 25 },
  { id: 'custom', label: 'Deep Folio (50m)', minutes: 50 },
  { id: 'adhd_sprint', label: 'Gentle Sprint (15m)', minutes: 15 },
  { id: 'short_break', label: 'Short Break (5m)', minutes: 5 },
  { id: 'long_break', label: 'Long Break (15m)', minutes: 15 },
];

const SOUND_OPTIONS: { id: AmbientSoundType; label: string }[] = [
  { id: 'none', label: 'Silence' },
  { id: 'rain', label: 'Library Rain' },
  { id: 'hearth', label: 'Hearth Fire' },
  { id: 'archive', label: 'Quiet Archive' },
  { id: 'binaural', label: '40Hz Focus Hum' },
];

export const FocusRoom: React.FC = () => {
  const { profile, subjects, chapters, focusSessions, recordFocusSession, updatePreferences } = useApp();

  const initialMode: FocusModeType = profile?.adhdMode ? 'adhd_sprint' : 'pomodoro';
  const initialMins = profile?.adhdMode ? 15 : 25;

  const [mode, setMode] = useState<FocusModeType>(initialMode);
  const [durationMinutes, setDurationMinutes] = useState<number>(initialMins);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialMins * 60);
  const [running, setRunning] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [sound, setSound] = useState<AmbientSoundType>(profile?.ambientSound || 'none');
  const [volume, setVolume] = useState<number>(0.35);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);

  const completedRef = useRef(false);

  useEffect(() => {
    if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  // Ambient sound control
  useEffect(() => {
    ambientAudio.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (running && sound !== 'none') {
      ambientAudio.play(sound);
    } else if (!running) {
      ambientAudio.stop();
    }
    return () => {
      ambientAudio.stop();
    };
  }, [running, sound]);

  // Countdown tick
  useEffect(() => {
    if (!running) return;
    completedRef.current = false;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  // Handle session completion at 0
  useEffect(() => {
    if (running && secondsLeft === 0 && !completedRef.current) {
      completedRef.current = true;
      setRunning(false);
      const subj = subjects.find((s) => s.id === selectedSubjectId);
      void recordFocusSession({
        subjectId: selectedSubjectId || '',
        subjectTitle: subj?.title || 'Independent Study',
        chapterId: selectedChapterId || '',
        durationMinutes,
        mode,
      });
      const isBreak = mode === 'short_break' || mode === 'long_break';
      setCompletionBanner(
        isBreak
          ? `Rest interval complete (${durationMinutes} min). Ready to resume when you are.`
          : `Focus session recorded (${durationMinutes} min). XP awarded to your scholarly rank.`
      );
    }
  }, [running, secondsLeft, subjects, selectedSubjectId, selectedChapterId, durationMinutes, mode, recordFocusSession]);

  const selectPreset = (preset: PresetOption) => {
    setRunning(false);
    setMode(preset.id);
    setDurationMinutes(preset.minutes);
    setSecondsLeft(preset.minutes * 60);
    setCompletionBanner(null);
  };

  const applyCustomMinutes = (mins: number) => {
    const safe = Math.max(5, Math.min(180, mins || 25));
    setRunning(false);
    setMode('custom');
    setDurationMinutes(safe);
    setSecondsLeft(safe * 60);
    setCompletionBanner(null);
  };

  const handleLogElapsedEarly = async () => {
    const elapsedSeconds = durationMinutes * 60 - secondsLeft;
    const elapsedMins = Math.max(1, Math.round(elapsedSeconds / 60));
    setRunning(false);
    const subj = subjects.find((s) => s.id === selectedSubjectId);
    await recordFocusSession({
      subjectId: selectedSubjectId || '',
      subjectTitle: subj?.title || 'Independent Study',
      chapterId: selectedChapterId || '',
      durationMinutes: elapsedMins,
      mode,
    });
    setSecondsLeft(durationMinutes * 60);
    setCompletionBanner(`Recorded ${elapsedMins} minutes of study.`);
  };

  const handleSoundChange = (next: AmbientSoundType) => {
    setSound(next);
    if (running) {
      ambientAudio.play(next);
    }
    void updatePreferences({ ambientSound: next });
  };

  const minsDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secsDisplay = String(secondsLeft % 60).padStart(2, '0');
  const progressPct = Math.round(((durationMinutes * 60 - secondsLeft) / Math.max(1, durationMinutes * 60)) * 100);

  const todayKey = getTodayDateKey();
  const studySessionsOnly = focusSessions.filter((s) => s.mode !== 'short_break' && s.mode !== 'long_break');
  const todayMinutes = studySessionsOnly
    .filter((s) => s.dateKey === todayKey)
    .reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgMinutes = studySessionsOnly.length
    ? Math.round(studySessionsOnly.reduce((a, s) => a + s.durationMinutes, 0) / studySessionsOnly.length)
    : 0;

  const subjectChapters = chapters.filter((c) => c.subjectId === selectedSubjectId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-[var(--da-gold-bright)]">Focus Room</p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
          Scholarly Study Timer & Soundscape
        </h1>
      </div>

      {completionBanner && (
        <div className="rounded-xl bg-[var(--da-walnut)] border border-[var(--da-gold-bright)]/50 px-4 py-3 flex items-center justify-between gap-3 text-sm text-[var(--da-ink)]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0" />
            <span>{completionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setCompletionBanner(null)}
            className="text-xs text-[var(--da-muted)] hover:text-[var(--da-ink)]"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer Console */}
        <section className="lg:col-span-7 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 sm:p-8 space-y-6">
          {/* Preset selector */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPreset(p)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                  mode === p.id && durationMinutes === p.minutes
                    ? 'bg-[var(--da-walnut)] border border-[var(--da-gold-bright)] text-[var(--da-ink)]'
                    : 'bg-[var(--da-bg)]/60 border border-[var(--da-border)] text-[var(--da-muted)] hover:text-[var(--da-ink)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Dial / Clock */}
          <div className="py-4 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="54" stroke="var(--da-bg)" strokeWidth="5" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  stroke="#B89872"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - progressPct / 100)}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono-tabular text-5xl sm:text-6xl font-semibold text-[var(--da-ink)] tracking-tight">
                  {minsDisplay}:{secsDisplay}
                </span>
                <span className="text-xs text-[var(--da-muted)] mt-1 capitalize">
                  {mode.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                className="min-h-[48px] min-w-[140px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-6 py-3 text-sm font-medium transition-colors"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{running ? 'Pause' : 'Start Session'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(durationMinutes * 60);
                }}
                aria-label="Reset timer"
                className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-[var(--da-parchment)]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {secondsLeft < durationMinutes * 60 && secondsLeft > 0 && (
                <button
                  type="button"
                  onClick={() => void handleLogElapsedEarly()}
                  className="min-h-[48px] px-4 rounded-xl border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs font-medium text-[var(--da-parchment)]"
                >
                  Finish & Log Now
                </button>
              )}
            </div>
          </div>

          {/* Custom length & Subject Link */}
          <div className="pt-4 border-t border-[var(--da-border)] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-[var(--da-muted)]">Custom Minutes</label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => applyCustomMinutes(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--da-muted)]">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedChapterId('');
                }}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              >
                <option value="">Independent Study</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-[var(--da-muted)]">Chapter (Optional)</label>
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              >
                <option value="">General Subject</option>
                {subjectChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Right Column: Ambient Sounds + Stats + History */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">
                Ambient Soundscape
              </h2>
              {sound === 'none' ? (
                <VolumeX className="w-4 h-4 text-[var(--da-muted)]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[var(--da-gold-bright)]" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SOUND_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSoundChange(opt.id)}
                  className={`min-h-[42px] px-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                    sound === opt.id
                      ? 'bg-[var(--da-walnut)] border-[var(--da-gold-bright)] text-[var(--da-ink)]'
                      : 'bg-[var(--da-bg)]/50 border-[var(--da-border)] text-[var(--da-muted)] hover:text-[var(--da-ink)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--da-muted)]">
                <span>Volume</span>
                <span className="font-mono-tabular">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#B89872]"
              />
            </div>
          </section>

          <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-5 space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">Focus Statistics</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[var(--da-bg)]/60">
                <p className="font-mono-tabular text-lg font-semibold text-[var(--da-ink)]">{todayMinutes}m</p>
                <p className="text-[11px] text-[var(--da-muted)]">Today</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--da-bg)]/60">
                <p className="font-mono-tabular text-lg font-semibold text-[var(--da-ink)]">{studySessionsOnly.length}</p>
                <p className="text-[11px] text-[var(--da-muted)]">Sessions</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--da-bg)]/60">
                <p className="font-mono-tabular text-lg font-semibold text-[var(--da-ink)]">{avgMinutes}m</p>
                <p className="text-[11px] text-[var(--da-muted)]">Average</p>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <p className="text-xs text-[var(--da-muted)]">Recent Session Log</p>
              {focusSessions.length === 0 ? (
                <p className="text-xs text-[var(--da-muted)] py-3">Complete a session to build your study log.</p>
              ) : (
                focusSessions.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 py-2 border-b border-[var(--da-border)] last:border-0 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-[var(--da-parchment)] truncate">{s.subjectTitle || 'Independent Study'}</p>
                      <p className="text-[11px] text-[var(--da-muted)] font-mono-tabular">{s.dateKey} · {s.mode.replace('_', ' ')}</p>
                    </div>
                    <span className="font-mono-tabular text-[var(--da-gold-bright)] whitespace-nowrap">
                      {s.durationMinutes}m {s.xpEarned > 0 ? `· +${s.xpEarned} XP` : ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
