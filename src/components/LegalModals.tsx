import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface BillingConfigResponse {
  stripeConfigured: boolean;
  trialDays: number;
  plans: {
    monthly: { id: string; label: string; priceDisplay: string; interval: string; configured: boolean };
    annual: { id: string; label: string; priceDisplay: string; interval: string; savingsNote: string; configured: boolean };
  };
  nativeStoreProducts: {
    androidPackageId: string;
    iosBundleId: string;
    monthlyProductId: string;
    annualProductId: string;
  };
  requiredConfiguration: string[];
}

export const LegalModal: React.FC<{
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--da-surface)] border border-[var(--da-border)] text-[var(--da-ink)] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--da-border)]">
          <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
            {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close legal document"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--da-muted)] hover:text-[var(--da-ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm leading-relaxed text-[var(--da-parchment)]/90">
          {type === 'privacy' ? (
            <>
              <p className="text-xs text-[var(--da-muted)]">Effective Date: November 14, 2026 · DARK ACADEMIA (`com.darkacademia.study`)</p>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">1. Data We Collect & Why</h3>
                <p>
                  DARK ACADEMIA stores only the academic records you deliberately create: your display name, academic level, study goals, subjects, chapters, study notes, formulas, focus session durations, backlog tasks, quiz scores, and exam dates. Your account email is isolated inside a private subcollection strictly accessible to your authenticated user ID.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">2. Minimal Device Permissions</h3>
                <p>
                  We do not request access to your camera, microphone, contacts, precise location, or photo library. Browser or local notifications are requested only if you explicitly enable Exam Countdown reminders inside Settings.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">3. Offline Storage & Cloud Sync</h3>
                <p>
                  Study data is cached locally in your browser or device database for offline availability and synchronized securely via Google Firebase Firestore with TLS encryption in transit and strict owner-only security rules.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">4. Your Right to Delete Everything</h3>
                <p>
                  You may permanently delete your account and all associated subjects, notes, sessions, quizzes, and personal records at any time from <strong>User Profile → Delete Account & Data</strong>. Deletion is immediate and irreversible.
                </p>
              </section>
            </>
          ) : (
            <>
              <p className="text-xs text-[var(--da-muted)]">Effective Date: November 14, 2026 · DARK ACADEMIA</p>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">1. Scholarly Purpose</h3>
                <p>
                  DARK ACADEMIA provides personal study planning, focus timing, note archiving, revision scheduling, and self-testing tools for high-school students, university scholars, and independent learners.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">2. Subscriptions & Trials</h3>
                <p>
                  Free accounts include core study tracking, Pomodoro timer, daily missions, up to 15 chapters with notes/formulas, and introductory Boss Battle quizzes. Premium plans ($6.99/month or $49.99/year) include a 7-day free trial where configured through Apple App Store, Google Play Billing, or Stripe Web Checkout, and auto-renew unless canceled at least 24 hours before the end of the current period.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">3. User Content Ownership</h3>
                <p>
                  You retain full ownership of all notes, formulas, custom quizzes, and academic materials you enter into your Personal Library.
                </p>
              </section>
              <section className="space-y-2">
                <h3 className="font-display text-lg font-semibold text-[var(--da-ink)]">4. Fair Use & Account Termination</h3>
                <p>
                  Automated abuse of cloud storage quotas or attempts to bypass subscription or XP integrity checks may result in account suspension. You may terminate your account at any time in Profile Settings.
                </p>
              </section>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--da-border)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 rounded-lg bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const PricingModal: React.FC = () => {
  const { showPricingModal, setShowPricingModal, profile, privateAccount } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'annual'>('annual');
  const [billingConfig, setBillingConfig] = useState<BillingConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!showPricingModal) return;
    setLoadingConfig(true);
    setStatusMessage(null);
    setErrorMessage(null);
    fetch('/api/billing/config')
      .then((res) => res.json())
      .then((data: BillingConfigResponse) => setBillingConfig(data))
      .catch(() => setErrorMessage('Unable to reach billing configuration endpoint.'))
      .finally(() => setLoadingConfig(false));
  }, [showPricingModal]);

  if (!showPricingModal) return null;

  const isPremium = profile?.plan === 'premium';

  const handleCheckout = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPeriod,
          email: privateAccount?.email || '',
          uid: profile?.uid || '',
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string; missingConfig?: string[] };
      if (!res.ok) {
        setErrorMessage(
          data.missingConfig
            ? `${data.error} Required environment variables: ${data.missingConfig.join(', ')}.`
            : data.error || 'Checkout unavailable.'
        );
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
      }
    } catch {
      setErrorMessage('Network error connecting to billing gateway.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/billing/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: privateAccount?.email || '' }),
      });
      const data = (await res.json()) as { restored?: boolean; message?: string; error?: string; status?: string };
      if (!res.ok) {
        setErrorMessage(data.error || 'Unable to verify purchases.');
      } else if (data.restored) {
        setStatusMessage(`Active subscription verified (${data.status}).`);
      } else {
        setStatusMessage(data.message || 'No active subscription found for this account.');
      }
    } catch {
      setErrorMessage('Unable to verify purchases while offline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--da-surface)] border border-[var(--da-gold)]/40 text-[var(--da-ink)] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--da-border)]">
          <div>
            <p className="text-xs text-[var(--da-gold-bright)]">DARK ACADEMIA Fellowship</p>
            <h2 className="font-display text-2xl font-semibold text-[var(--da-parchment)]">
              Free vs. Premium Membership
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setShowPricingModal(false)}
            aria-label="Close pricing"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--da-muted)] hover:text-[var(--da-ink)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Billing cycle selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedPeriod('monthly')}
              className={`text-left p-4 rounded-xl border transition-colors min-h-[88px] ${
                selectedPeriod === 'monthly'
                  ? 'bg-[var(--da-walnut)]/70 border-[var(--da-gold-bright)]'
                  : 'bg-[var(--da-bg)]/60 border-[var(--da-border)] hover:border-[var(--da-gold)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--da-parchment)]">Monthly Scholar</span>
                <span className="font-mono-tabular text-lg font-semibold text-[var(--da-ink)]">$6.99/mo</span>
              </div>
              <p className="mt-1 text-xs text-[var(--da-muted)]">7-day free trial · Cancel anytime</p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedPeriod('annual')}
              className={`text-left p-4 rounded-xl border transition-colors min-h-[88px] ${
                selectedPeriod === 'annual'
                  ? 'bg-[var(--da-walnut)]/70 border-[var(--da-gold-bright)]'
                  : 'bg-[var(--da-bg)]/60 border-[var(--da-border)] hover:border-[var(--da-gold)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--da-parchment)]">Annual Fellow</span>
                <span className="font-mono-tabular text-lg font-semibold text-[var(--da-ink)]">$49.99/yr</span>
              </div>
              <p className="mt-1 text-xs text-[var(--da-gold-bright)]">Save 40% ($4.17/mo) · 7-day free trial</p>
            </button>
          </div>

          {/* Plan comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[var(--da-bg)]/60 border border-[var(--da-border)] space-y-2.5">
              <h3 className="font-display text-lg font-semibold text-[var(--da-parchment)]">Free Plan</h3>
              <ul className="space-y-2 text-xs text-[var(--da-muted)]">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Pomodoro, custom & ADHD focus timers</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Unlimited subjects & chapter completion</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Up to 15 chapters with notes & formulas</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Daily missions & up to 3 Boss Battles/day</span></li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[var(--da-walnut)]/35 border border-[var(--da-gold)]/50 space-y-2.5">
              <h3 className="font-display text-lg font-semibold text-[var(--da-ink)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--da-gold-bright)]" />
                <span>Premium Plan</span>
              </h3>
              <ul className="space-y-2 text-xs text-[var(--da-parchment)]">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Unlimited notes, formulas & custom quizzes</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Unlimited Boss Battle attempts & deep weak-topic analysis</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Advanced 30-day Vault analytics & revision schedules</span></li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0 mt-0.5" /><span>Candlelit Walnut & Bodleian Slate themes</span></li>
              </ul>
            </div>
          </div>

          {/* Transparent Billing Readiness Notice */}
          {loadingConfig ? (
            <p className="text-xs text-[var(--da-muted)]">Verifying official billing configuration…</p>
          ) : billingConfig && !billingConfig.stripeConfigured ? (
            <div className="rounded-xl bg-[var(--da-bg)] border border-[var(--da-gold)]/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--da-parchment)]">
                <ShieldCheck className="w-4 h-4 text-[var(--da-gold-bright)] shrink-0" />
                <span>Official Platform Billing Pending Store Credentials</span>
              </div>
              <p className="text-xs text-[var(--da-muted)] leading-relaxed">
                To uphold real commercial compliance without simulated purchases, live checkout activates once your merchant credentials are added to server secrets or store builds:
              </p>
              <ul className="text-xs font-mono-tabular text-[var(--da-parchment)]/85 space-y-1 pl-2">
                {billingConfig.requiredConfiguration.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {errorMessage && (
            <div className="rounded-lg bg-red-950/50 border border-red-400/40 px-4 py-3 text-xs text-red-200">
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="rounded-lg bg-[var(--da-walnut)] border border-[var(--da-gold-bright)]/50 px-4 py-3 text-xs text-[var(--da-ink)]">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--da-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleRestore()}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-lg border border-[var(--da-border)] hover:border-[var(--da-gold)] text-xs font-medium text-[var(--da-parchment)] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
            <span>Restore Purchases</span>
          </button>

          {isPremium ? (
            <span className="text-xs font-medium text-[var(--da-gold-bright)] text-center">
              Active Premium Fellowship ({privateAccount?.subscriptionPeriod || 'Active'})
            </span>
          ) : (
            <button
              type="button"
              disabled={submitting || !billingConfig?.stripeConfigured}
              onClick={() => void handleCheckout()}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 rounded-lg bg-[#80664B] hover:bg-[#947657] disabled:opacity-45 disabled:cursor-not-allowed text-[#EDE1CB] text-sm font-medium transition-colors"
            >
              <span>
                {billingConfig?.stripeConfigured
                  ? `Start 7-Day Free Trial (${selectedPeriod === 'annual' ? '$49.99/yr' : '$6.99/mo'})`
                  : 'Configure Billing Keys to Enable Checkout'}
              </span>
              {billingConfig?.stripeConfigured && <ExternalLink className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
