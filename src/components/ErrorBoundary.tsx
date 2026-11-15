import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let displayMsg = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message) as { error?: string; path?: string };
        if (parsed.error) {
          displayMsg = `${parsed.error}${parsed.path ? ` (${parsed.path})` : ''}`;
        }
      } catch {
        // Not JSON
      }

      return (
        <div className="min-h-screen bg-[#211A18] text-[#EDE1CB] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-[#2B211E] border border-[#D5C3A2]/20 p-6 space-y-4">
            <h1 className="font-display text-2xl font-semibold text-[#D5C3A2]">
              Sanctum Interruption
            </h1>
            <p className="text-sm text-[#A99782] leading-relaxed">
              Something went wrong while synchronizing your study archive. Your local progress remains intact.
            </p>
            <p className="text-xs font-mono-tabular text-[#D5C3A2]/80 bg-[#211A18] p-3 rounded-lg break-words">
              {displayMsg}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] rounded-lg bg-[#80664B] hover:bg-[#947657] text-[#EDE1CB] text-sm font-medium transition-colors"
            >
              Reload Study Sanctum
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
