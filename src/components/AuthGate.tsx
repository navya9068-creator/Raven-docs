import React, { useState } from 'react';
import { BookOpen, Clock, Compass, ShieldCheck } from 'lucide-react';
import heroSanctumImg from '../assets/images/hero_study_sanctum_1794719607206.jpg';
import crestOwlImg from '../assets/images/crest_owl_emblem_1794719607263.jpg';
import { useApp } from '../contexts/AppContext';
import { LegalModal } from './LegalModals';
import { PWAInstallButton } from './PWAControls';

export const AuthGate: React.FC = () => {
  const { signInWithGoogle } = useApp();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const handleLogin = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication could not be completed.';
      setError(msg);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#211A18] text-[#EDE1CB] flex flex-col justify-between">
      {/* Top 3-zone bar */}
      <header className="w-full max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-6 border-b border-[#D5C3A2]/10">
        <span className="font-display text-xl font-semibold tracking-wide text-[#D5C3A2] whitespace-nowrap shrink-0">
          DARK ACADEMIA
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={() => void handleLogin()}
            disabled={signingIn}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-xs font-medium transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {signingIn ? 'Opening Sanctum…' : 'Enter with Google'}
          </button>
        </div>
      </header>

      {/* Main Split Hero */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-5 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={crestOwlImg}
              alt="DARK ACADEMIA heraldic owl emblem"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-xl object-cover border border-[#80664B]/50 shrink-0"
            />
            <div className="text-xs text-[#A99782] space-y-0.5">
              <p className="text-[#D5C3A2] font-medium">Scholarly Productivity Sanctum</p>
              <p>High School · University · Independent Study</p>
            </div>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] text-[#EDE1CB]">
            Discipline is the architecture of knowledge.
          </h1>

          <p className="text-base text-[#D5C3A2]/85 leading-relaxed max-w-xl">
            Organize your syllabus, master difficult chapters with structured formulas, rescue overdue work with realistic schedules, and study with an optional calm ADHD-Friendly mode—synchronized across your devices and available offline.
          </p>

          {error && (
            <div className="rounded-lg bg-red-950/50 border border-red-400/40 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void handleLogin()}
              disabled={signingIn}
              className="min-h-[48px] px-6 py-3 rounded-xl bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {signingIn ? 'Authenticating…' : 'Sign In with Google to Begin'}
            </button>
          </div>

          {/* Grounded capability list without pill clutter */}
          <div className="pt-4 border-t border-[#D5C3A2]/10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#A99782]">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-[#B89872] shrink-0 mt-0.5" />
              <span>Personal Library, Notes & Chapter Formulas</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-[#B89872] shrink-0 mt-0.5" />
              <span>Focus Room, Ambient Audio & ADHD Mode</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-[#B89872] shrink-0 mt-0.5" />
              <span>Backlog Rescue, Boss Battles & Exam Prep</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 flex items-stretch">
          <div className="relative w-full min-h-[280px] rounded-2xl overflow-hidden border border-[#D5C3A2]/15 bg-[#2B211E]">
            <img
              src={heroSanctumImg}
              alt="Candlelit dark walnut study desk with leather folio and brass astrolabe"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211A18] via-[#211A18]/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 text-xs text-[#D5C3A2]">
              <span>Offline-Capable PWA · Cloud Sync</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#B89872]" />
                <span>Private Owner-Locked Storage</span>
              </span>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto px-5 py-5 border-t border-[#D5C3A2]/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#A99782]">
        <span>DARK ACADEMIA · Education & Productivity</span>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => setLegalDoc('privacy')}
            className="hover:text-[#EDE1CB] transition-colors underline underline-offset-4"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc('terms')}
            className="hover:text-[#EDE1CB] transition-colors underline underline-offset-4"
          >
            Terms of Service
          </button>
        </div>
      </footer>

      <LegalModal type={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  );
};
