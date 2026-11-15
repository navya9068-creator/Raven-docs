import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'full' }> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          variant === 'full'
            ? 'w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0'
            : 'min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-[#80664B]/60 bg-[#49362C]/60 hover:bg-[#49362C] text-[#EDE1CB] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            variant === 'full'
              ? 'w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg border border-[#80664B]/60 bg-[#49362C]/60 hover:bg-[#49362C] text-[#EDE1CB] px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0'
              : 'min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-[#80664B]/60 bg-[#49362C]/60 hover:bg-[#49362C] text-[#EDE1CB] px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0'
          }
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#2B211E] border border-[#D5C3A2]/20 p-6 shadow-2xl text-[#EDE1CB]">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-display text-2xl font-semibold text-[#D5C3A2]">
                  Add to Home Screen
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close guide"
                  className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center text-[#A99782] hover:text-[#EDE1CB]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-[#D5C3A2]/90 leading-relaxed">
                <li>1. Tap the <strong>Share</strong> icon in Safari’s bottom or top bar.</li>
                <li>2. Scroll down and select <strong>Add to Home Screen</strong>.</li>
                <li>3. Tap <strong>Add</strong> to launch DARK ACADEMIA full-screen offline.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-lg bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-5 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#49362C] border border-[#80664B]/60 px-3.5 py-2 text-xs font-medium text-[#EDE1CB] shadow-xl"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D5C3A2]" />
      <span>Offline Mode — Local study cache active; changes sync when reconnected.</span>
    </div>
  );
};
