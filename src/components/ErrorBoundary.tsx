/**
 * Error Boundary - Catches React errors and displays a fallback UI
 *
 * Wraps major sections of the app to prevent the entire UI from crashing.
 * Shows a user-friendly error message with options to retry or dismiss.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback component to render on error */
  fallback?: ReactNode;
  /** Name of the section for error reporting */
  sectionName?: string;
  /** Whether to use dark mode styling */
  isDarkMode?: boolean;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`Error in ${this.props.sectionName || 'component'}:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDarkMode = this.props.isDarkMode ?? false;
      const bgColor = isDarkMode ? '#1f2937' : '#ffffff';
      const textColor = isDarkMode ? '#f3f4f6' : '#1f2937';
      const textSecondary = isDarkMode ? '#9ca3af' : '#6b7280';
      const borderColor = isDarkMode ? '#374151' : '#e5e7eb';

      return (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            margin: '20px',
            textAlign: 'center',
          }}
        >
          <AlertTriangle size={48} color="#ef4444" aria-hidden="true" />
          <h2
            style={{
              margin: '16px 0 8px',
              fontSize: '18px',
              fontWeight: '600',
              color: textColor,
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              margin: '0 0 20px',
              fontSize: '14px',
              color: textSecondary,
              maxWidth: '400px',
            }}
          >
            {this.props.sectionName
              ? `An error occurred in the ${this.props.sectionName}. `
              : 'An unexpected error occurred. '}
            Please try again or refresh the page.
          </p>
          {this.state.error && (
            <details
              style={{
                marginBottom: '20px',
                padding: '12px',
                background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '8px',
                maxWidth: '400px',
                textAlign: 'left',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#ef4444',
                  fontWeight: '500',
                }}
              >
                Error details
              </summary>
              <pre
                style={{
                  margin: '8px 0 0',
                  fontSize: '11px',
                  color: textSecondary,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error.message}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleRetry}
            aria-label="Retry loading the component"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
