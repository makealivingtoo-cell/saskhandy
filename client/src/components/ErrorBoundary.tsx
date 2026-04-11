import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught UI error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleTryAgain = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const errorMessage =
        this.state.error?.message?.trim() || "Something went wrong while loading this page.";

      const showStack = import.meta.env.DEV;

      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-border/60 shadow-sm p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>

              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Something went wrong
              </h2>

              <p className="text-sm text-muted-foreground max-w-lg mb-6">
                We hit an unexpected error while rendering this screen. You can try again, reload
                the page, or go back to the home page.
              </p>

              <div className="w-full rounded-xl border border-border/60 bg-muted/30 p-4 text-left mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Error Details
                </p>
                <p className="text-sm text-foreground break-words">{errorMessage}</p>

                {showStack && this.state.error?.stack && (
                  <pre className="mt-4 text-xs text-muted-foreground whitespace-pre-wrap break-words overflow-auto max-h-64">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={this.handleTryAgain}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                    "border border-border bg-white text-foreground hover:bg-muted/40 cursor-pointer transition-colors"
                  )}
                >
                  <RotateCcw size={16} />
                  Try Again
                </button>

                <button
                  onClick={this.handleReload}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                    "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer transition-opacity"
                  )}
                >
                  <RotateCcw size={16} />
                  Reload Page
                </button>

                <button
                  onClick={this.handleGoHome}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                    "border border-border bg-white text-foreground hover:bg-muted/40 cursor-pointer transition-colors"
                  )}
                >
                  <Home size={16} />
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;