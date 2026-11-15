import React from 'react';
import { AuthGate } from './components/AuthGate';
import { BacklogRescue } from './components/BacklogRescue';
import { BossBattle } from './components/BossBattle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExamCountdown } from './components/ExamCountdown';
import { FocusRoom } from './components/FocusRoom';
import { HomeDashboard } from './components/HomeDashboard';
import { PricingModal } from './components/LegalModals';
import { MissionBoard } from './components/MissionBoard';
import { NavigationShell } from './components/NavigationShell';
import { OfflineIndicator } from './components/PWAControls';
import { PersonalLibrary } from './components/PersonalLibrary';
import { ProgressVault } from './components/ProgressVault';
import { UserProfile } from './components/UserProfile';
import { AppProvider, useApp } from './contexts/AppContext';

const AppContent: React.FC = () => {
  const { firebaseUser, authLoading, dataLoading, syncError, activeSection } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#211A18] text-[#D5C3A2] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-3xl font-semibold">DARK ACADEMIA</p>
          <p className="text-xs text-[#A99782]">Opening the study sanctum…</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <AuthGate />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[#211A18] text-[#D5C3A2] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-3xl font-semibold">Synchronizing Archive</p>
          <p className="text-xs text-[#A99782]">Loading your subjects, sessions, and syllabus…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NavigationShell>
        {syncError && (
          <div className="rounded-xl bg-red-950/60 border border-red-400/40 px-4 py-3 text-xs text-red-200">
            {syncError}
          </div>
        )}
        {activeSection === 'dashboard' && <HomeDashboard />}
        {activeSection === 'library' && <PersonalLibrary />}
        {activeSection === 'focus' && <FocusRoom />}
        {activeSection === 'missions' && <MissionBoard />}
        {activeSection === 'backlog' && <BacklogRescue />}
        {activeSection === 'boss_battle' && <BossBattle />}
        {activeSection === 'vault' && <ProgressVault />}
        {activeSection === 'exams' && <ExamCountdown />}
        {activeSection === 'profile' && <UserProfile />}
      </NavigationShell>
      <PricingModal />
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
        <OfflineIndicator />
      </AppProvider>
    </ErrorBoundary>
  );
}
