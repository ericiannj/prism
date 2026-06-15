import * as React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
      <div className="w-10 h-10 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
        <span className="text-lg select-none">⚠</span>
      </div>
      <p className="text-sm font-semibold text-foreground">This section failed to load</p>
      <p className="text-xs text-muted-foreground">The rest of the app is still working.</p>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-primary border border-primary/30 rounded-lg px-4 py-1.5 hover:bg-primary/10 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
