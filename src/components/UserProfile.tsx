import React, { useState } from 'react';
import {
  Check,
  Feather,
  LogOut,
  Palette,
  ShieldAlert,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import crestOwlImg from '../assets/images/crest_owl_emblem_1794719607263.jpg';
import { useApp } from '../contexts/AppContext';
import type { AcademicLevel, CrestId, ThemeVariant } from '../types/domain';
import { LegalModal } from './LegalModals';
import { PWAInstallButton } from './PWAControls';

export const UserProfile: React.FC = () => {
  const {
    profile,
    privateAccount,
    updatePreferences,
    signOutUser,
    deleteAccountAndData,
    setShowPricingModal,
  } = useApp();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(profile?.academicLevel || 'undergraduate');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(profile?.dailyGoalMinutes || 90);
  const [savedNotice, setSavedNotice] = useState(false);

  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!profile) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePreferences({
      displayName,
      academicLevel,
      dailyGoalMinutes,
    });
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleThemeSelect = (variant: ThemeVariant) => {
    void updatePreferences({ themeVariant: variant });
  };

  const handleConfirmDelete = async () => {
    if (deleteText.trim().toUpperCase() !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccountAndData();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--da-gold-bright)]">Scholarly Identity</p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[var(--da-ink)]">
            Profile, Settings & Membership
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="min-h-[40px] inline-flex items-center gap-2 px-4 rounded-lg border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs text-[var(--da-parchment)]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Form */}
        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="lg:col-span-7 rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-5"
        >
          <div className="flex items-center gap-4">
            <img
              src={crestOwlImg}
              alt="Scholar crest"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-[var(--da-gold)]/50"
            />
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold text-[var(--da-ink)] truncate">
                {profile.displayName}
              </p>
              <p className="text-xs text-[var(--da-muted)] truncate">
                Cloud Synchronized Sanctum
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Scholarly Alias</label>
              <input
                required
                maxLength={60}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Scholar"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Academic Level</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              >
                <option value="high_school">High School</option>
                <option value="undergraduate">Undergraduate</option>
                <option value="postgraduate">Postgraduate</option>
                <option value="independent">Independent Learner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Daily Study Goal (minutes)</label>
              <input
                type="number"
                min={10}
                max={720}
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm font-mono-tabular"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--da-muted)]">Society Crest</label>
              <select
                value={profile.crestId}
                onChange={(e) => void updatePreferences({ crestId: e.target.value as CrestId })}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-[var(--da-border)] text-sm"
              >
                <option value="owl">Owl of Minerva</option>
                <option value="astrolabe">Brass Astrolabe</option>
                <option value="folio">Leather Folio</option>
                <option value="laurel">Scholar’s Laurel</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="text-xs text-[var(--da-gold-bright)] inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Saved & synchronized</span>
              </span>
            ) : (
              <span className="text-xs text-[var(--da-muted)]">Real-time Firestore sync active</span>
            )}
            <button
              type="submit"
              className="min-h-[44px] px-5 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>

        {/* Subscription & Accessibility Settings */}
        <div className="lg:col-span-5 space-y-6">
          <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
                Membership Plan
              </h2>
              <span className="font-mono-tabular text-xs uppercase text-[var(--da-gold-bright)]">
                {profile.plan}
              </span>
            </div>
            <p className="text-xs text-[var(--da-muted)] leading-relaxed">
              {profile.plan === 'premium'
                ? 'Your Premium Fellowship unlocks unlimited notes, quizzes, 30-day Vault analytics, and bespoke themes.'
                : 'Upgrade to Premium ($6.99/mo or $49.99/yr with 7-day trial) for unlimited notes, custom quizzes, 30-day Vault charts, and additional themes.'}
            </p>
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Manage Subscription & Restore</span>
            </button>
          </section>

          <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4">
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)]">
              Study Environment
            </h2>

            <button
              type="button"
              onClick={() => void updatePreferences({ adhdMode: !profile.adhdMode })}
              className="w-full min-h-[48px] px-4 rounded-xl bg-[var(--da-bg)]/60 border border-[var(--da-border)] flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2.5">
                <Feather className="w-4 h-4 text-[var(--da-gold-bright)]" />
                <span>ADHD-Friendly Mode</span>
              </span>
              <span className="font-mono-tabular text-xs text-[var(--da-gold-bright)]">
                {profile.adhdMode ? 'Enabled' : 'Disabled'}
              </span>
            </button>

            <div className="space-y-2">
              <p className="text-xs text-[var(--da-muted)] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[var(--da-gold-bright)]" />
                <span>Sanctum Theme</span>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'midnight', label: 'Midnight', free: true },
                    { id: 'walnut', label: 'Walnut', free: false },
                    { id: 'slate', label: 'Slate', free: false },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleThemeSelect(t.id)}
                    className={`min-h-[42px] px-2 rounded-xl border text-xs font-medium transition-colors ${
                      profile.themeVariant === t.id
                        ? 'bg-[var(--da-walnut)] border-[var(--da-gold-bright)] text-[var(--da-ink)]'
                        : 'bg-[var(--da-bg)]/50 border-[var(--da-border)] text-[var(--da-muted)]'
                    }`}
                  >
                    {t.label}
                    {!t.free && profile.plan !== 'premium' ? ' · Pro' : ''}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Store Distribution & Legal Compliance */}
      <section className="rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--da-parchment)] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[var(--da-gold-bright)]" />
              <span>Mobile Distribution & Legal Policies</span>
            </h2>
            <p className="text-xs text-[var(--da-muted)] mt-1 font-mono-tabular">
              Bundle ID: com.darkacademia.study · Android AAB & iOS IPA Capacitor Ready · Offline PWA Active
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="text-[var(--da-parchment)] underline underline-offset-4"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="text-[var(--da-parchment)] underline underline-offset-4"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </section>

      {/* Account & Data Deletion */}
      <section className="rounded-2xl bg-[var(--da-surface)] border border-red-400/25 p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-display text-xl font-semibold text-red-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-300" />
              <span>Delete Account & All Data</span>
            </h2>
            <p className="text-xs text-[var(--da-muted)]">
              Permanently erase your subjects, notes, focus logs, quizzes, exams, and authentication record.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmDelete((v) => !v)}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl border border-red-400/40 text-red-200 hover:bg-red-950/50 text-xs font-medium whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>

        {confirmDelete && (
          <div className="pt-3 border-t border-red-400/20 space-y-3">
            <p className="text-xs text-red-200">
              Type <strong className="font-mono-tabular">DELETE</strong> below to permanently purge all cloud data and remove your account.
            </p>
            {deleteError && <p className="text-xs text-red-300">{deleteError}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[var(--da-bg)] border border-red-400/40 text-sm font-mono-tabular"
              />
              <button
                type="button"
                disabled={deleting || deleteText.trim().toUpperCase() !== 'DELETE'}
                onClick={() => void handleConfirmDelete()}
                className="min-h-[44px] px-5 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-medium"
              >
                {deleting ? 'Deleting Everything…' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        )}
      </section>

      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
};
