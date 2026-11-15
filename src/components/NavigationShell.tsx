import React from 'react';
import {
  Award,
  BarChart3,
  BookMarked,
  CalendarClock,
  Clock,
  Compass,
  Feather,
  Flame,
  Home,
  LifeBuoy,
  Sparkles,
  Swords,
  UserCircle2,
} from 'lucide-react';
import crestOwlImg from '../assets/images/crest_owl_emblem_1794719607263.jpg';
import { useApp } from '../contexts/AppContext';
import { getRankForXp, type NavSection } from '../types/domain';
import { PWAInstallButton } from './PWAControls';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Sanctum', icon: Home },
  { id: 'library', label: 'Library', icon: BookMarked },
  { id: 'focus', label: 'Focus Room', icon: Clock },
  { id: 'missions', label: 'Missions', icon: Award },
  { id: 'backlog', label: 'Backlog Rescue', icon: LifeBuoy },
  { id: 'boss_battle', label: 'Boss Battle', icon: Swords },
  { id: 'vault', label: 'Progress Vault', icon: BarChart3 },
  { id: 'exams', label: 'Exam Countdown', icon: CalendarClock },
  { id: 'profile', label: 'Profile & Plan', icon: UserCircle2 },
];

const SCHOLAR_SUBVIEWS: { id: NavSection; label: string }[] = [
  { id: 'missions', label: 'Missions' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'boss_battle', label: 'Boss Battle' },
  { id: 'exams', label: 'Exams' },
];

export const NavigationShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, activeSection, setActiveSection, updatePreferences, setShowPricingModal } = useApp();
  const rank = getRankForXp(profile?.xp || 0);
  const isAdhd = Boolean(profile?.adhdMode);

  const isScholarGroup =
    activeSection === 'missions' ||
    activeSection === 'backlog' ||
    activeSection === 'boss_battle' ||
    activeSection === 'exams';

  const isVaultGroup = activeSection === 'vault' || activeSection === 'profile';

  const toggleAdhdMode = () => {
    if (!profile) return;
    void updatePreferences({ adhdMode: !profile.adhdMode });
  };

  return (
    <div className="min-h-screen bg-[var(--da-bg)] text-[var(--da-ink)] flex flex-col lg:flex-row">
      {/* Desktop Sidebar Rail */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[var(--da-surface)] border-r border-[var(--da-border)] z-30">
        <div className="px-5 py-5 border-b border-[var(--da-border)] flex items-center gap-3">
          <img
            src={crestOwlImg}
            alt="DARK ACADEMIA crest"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-lg object-cover border border-[var(--da-gold)]/50 shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold tracking-wide text-[var(--da-parchment)] truncate">
              DARK ACADEMIA
            </p>
            <p className="text-[11px] text-[var(--da-muted)] truncate">
              {rank.roman}. {rank.title} · <span className="font-mono-tabular">{profile?.xp ?? 0} XP</span>
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-[var(--da-walnut)] text-[var(--da-ink)] font-medium border border-[var(--da-gold)]/40'
                    : 'text-[var(--da-muted)] hover:text-[var(--da-ink)] hover:bg-[var(--da-bg)]/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[var(--da-gold-bright)]' : ''}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--da-border)] space-y-3">
          <button
            type="button"
            onClick={toggleAdhdMode}
            className={`w-full min-h-[42px] flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
              isAdhd
                ? 'bg-[var(--da-walnut)] border-[var(--da-gold-bright)] text-[var(--da-ink)]'
                : 'bg-[var(--da-bg)]/50 border-[var(--da-border)] text-[var(--da-muted)] hover:text-[var(--da-ink)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Feather className="w-3.5 h-3.5 text-[var(--da-gold-bright)]" />
              <span>ADHD-Friendly Mode</span>
            </span>
            <span className="font-mono-tabular text-[11px]">{isAdhd ? 'ON' : 'OFF'}</span>
          </button>

          {profile?.plan !== 'premium' && (
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="w-full min-h-[42px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to Premium</span>
            </button>
          )}

          <PWAInstallButton variant="full" />
        </div>
      </aside>

      {/* Mobile Compact Sticky Top Bar (48px) */}
      <header className="lg:hidden sticky top-0 z-30 h-12 px-4 bg-[var(--da-surface)]/95 backdrop-blur-md border-b border-[var(--da-border)] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveSection('dashboard')}
          className="font-display text-lg font-semibold text-[var(--da-parchment)] whitespace-nowrap shrink-0"
        >
          DARK ACADEMIA
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleAdhdMode}
            aria-label="Toggle ADHD-Friendly Mode"
            className={`min-h-[36px] px-2.5 rounded-lg border text-[11px] font-medium inline-flex items-center gap-1.5 whitespace-nowrap ${
              isAdhd
                ? 'bg-[var(--da-walnut)] border-[var(--da-gold-bright)] text-[var(--da-ink)]'
                : 'bg-[var(--da-bg)]/50 border-[var(--da-border)] text-[var(--da-muted)]'
            }`}
          >
            <Feather className="w-3.5 h-3.5 text-[var(--da-gold-bright)]" />
            <span>{isAdhd ? 'Calm On' : 'Calm'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            aria-label="Open User Profile"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[var(--da-border)] text-[var(--da-parchment)]"
          >
            <UserCircle2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 lg:pl-64 pb-20 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
          {/* Mobile contextual sub-switcher when inside Scholar or Vault groups */}
          {isScholarGroup && (
            <div className="lg:hidden flex items-center gap-1.5 p-1 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)] overflow-x-auto">
              {SCHOLAR_SUBVIEWS.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setActiveSection(sub.id)}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeSection === sub.id
                      ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]'
                      : 'text-[var(--da-muted)] hover:text-[var(--da-ink)]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}

          {isVaultGroup && (
            <div className="lg:hidden flex items-center gap-1.5 p-1 rounded-xl bg-[var(--da-surface)] border border-[var(--da-border)]">
              <button
                type="button"
                onClick={() => setActiveSection('vault')}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSection === 'vault'
                    ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]'
                    : 'text-[var(--da-muted)] hover:text-[var(--da-ink)]'
                }`}
              >
                Progress Vault
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('profile')}
                className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSection === 'profile'
                    ? 'bg-[var(--da-walnut)] text-[var(--da-ink)]'
                    : 'text-[var(--da-muted)] hover:text-[var(--da-ink)]'
                }`}
              >
                Profile & Plan
              </button>
            </div>
          )}

          {children}
        </div>
      </main>

      {/* Mobile Bottom Thumb Navigation Bar (56px + safe area) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--da-surface)]/95 backdrop-blur-md border-t border-[var(--da-border)] pb-safe"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeSection === 'dashboard' ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Sanctum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('library')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeSection === 'library' ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px] font-medium">Library</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('focus')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              activeSection === 'focus' ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px] font-medium">Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection(isScholarGroup ? activeSection : 'missions')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              isScholarGroup ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Scholar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection(isVaultGroup ? activeSection : 'vault')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 ${
              isVaultGroup ? 'text-[var(--da-gold-bright)]' : 'text-[var(--da-muted)]'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
