import React, { useState } from 'react';
import { Award, CheckCircle2, Circle, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { BADGE_DEFINITIONS, getTodayDateKey } from '../types/domain';

export const MissionBoard: React.FC = () => {
  const { profile, missions, claimMission, addCustomMission, deleteMission } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState(40);
  const [feedback, setFeedback] = useState<string | null>(null);

  const todayKey = getTodayDateKey();
  const dailyMissions = missions.filter((m) => m.type === 'daily' && m.id.endsWith(todayKey));
  const customMissions = missions.filter((m) => m.type === 'custom');

  const handleClaim = async (m: (typeof missions)[number]) => {
    const res = await claimMission(m);
    if (res.awarded) {
      setFeedback(`Mission completed: +${res.xpEarned} XP recorded.`);
    } else {
      setFeedback('XP for this mission was already awarded.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addCustomMission({ title, description, xpReward });
    setTitle('');
    setDescription('');
    setXpReward(40);
    setShowCreate(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--da-gold-bright)]">Mission Board</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
            Academic Challenges & Badges
          </h1>
          <p className="text-sm text-[var(--da-muted)] mt-1">
            Complete daily rituals or craft custom goals. Duplicate XP claims are locked automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2.5 text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Mission</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl bg-[var(--da-walnut)] border border-[var(--da-gold-bright)]/50 px-4 py-3 flex items-center justify-between text-xs text-[var(--da-ink)]">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--da-gold-bright)]" />
            <span>{feedback}</span>
          </span>
          <button type="button" onClick={() => setFeedback(null)} className="text-[var(--da-muted)]">
            Dismiss
          </button>
        </div>
      )}

      {/* Daily Academic Challenges */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
          Daily Challenges ({todayKey})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dailyMissions.map((m) => (
            <button
              key={m.id}
              type="button"
              disabled={m.xpAwarded}
              onClick={() => void handleClaim(m)}
              className={`min-h-[76px] text-left p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
                m.xpAwarded
                  ? 'bg-[var(--da-surface)]/50 border-[var(--da-border)] opacity-75 cursor-default'
                  : 'bg-[var(--da-surface)] border-[var(--da-border)] hover:border-[var(--da-gold)]'
              }`}
            >
              {m.xpAwarded ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--da-gold-bright)] shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-[var(--da-muted)] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${m.xpAwarded ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-ink)]'}`}>
                    {m.title}
                  </p>
                  <span className="font-mono-tabular text-xs text-[var(--da-gold-bright)] shrink-0">
                    {m.xpAwarded ? 'Claimed' : `+${m.xpReward} XP`}
                  </span>
                </div>
                <p className="text-xs text-[var(--da-muted)] mt-1">{m.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Missions */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">Custom Missions</h2>
        {customMissions.length === 0 ? (
          <div className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 text-sm text-[var(--da-muted)]">
            No custom missions yet. Add a targeted study goal for today’s seminar or lab.
          </div>
        ) : (
          <div className="space-y-2.5">
            {customMissions.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-4 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  disabled={m.xpAwarded}
                  onClick={() => void handleClaim(m)}
                  className="flex items-start gap-3 text-left flex-1 min-w-0"
                >
                  {m.xpAwarded ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--da-gold-bright)] shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-[var(--da-muted)] shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${m.xpAwarded ? 'line-through text-[var(--da-muted)]' : 'text-[var(--da-ink)]'}`}>
                      {m.title}
                    </p>
                    {m.description && <p className="text-xs text-[var(--da-muted)] mt-0.5">{m.description}</p>}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono-tabular text-xs text-[var(--da-gold-bright)]">
                    {m.xpAwarded ? 'Claimed' : `+${m.xpReward} XP`}
                  </span>
                  <button
                    type="button"
                    onClick={() => void deleteMission(m.id)}
                    aria-label={`Delete ${m.title}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)] hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Achievement Badges */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">Achievement Badges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const unlocked = profile?.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-4 flex items-start gap-3 ${
                  unlocked
                    ? 'bg-[var(--da-walnut)]/40 border-[var(--da-gold)]/50'
                    : 'bg-[var(--da-surface)]/50 border-[var(--da-border)] opacity-65'
                }`}
              >
                <Award className={`w-5 h-5 shrink-0 mt-0.5 ${unlocked ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--da-ink)]">{badge.title}</p>
                  <p className="text-xs text-[var(--da-muted)] mt-0.5">{badge.criteria}</p>
                  <p className="text-[11px] font-mono-tabular text-[var(--da-gold-bright)] mt-1">
                    {unlocked ? 'Earned' : 'Locked'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="w-full max-w-md rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4 text-[var(--da-ink)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">New Custom Mission</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[var(--da-muted)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Mission Title</label>
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Outline Problem Set 4"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Description</label>
              <textarea
                rows={2}
                maxLength={300}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">XP Reward (5 – 250)</label>
              <input
                type="number"
                min={5}
                max={250}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--da-border)] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium"
              >
                Create Mission
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
