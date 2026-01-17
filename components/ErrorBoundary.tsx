"use client";

import React, { Component, ReactNode } from "react";
import Button from "./Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="glass-card p-8 md:p-12 max-w-2xl w-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-400/20 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-3xl md:text-4xl font-heading font-black mb-4">
              Oops! Something went wrong
            </h1>

            <p className="text-white/70 text-lg mb-4">
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>

            {this.state.error && (
              <details className="glass-card p-4 text-left mt-4">
                <summary className="cursor-pointer text-white/70 mb-2">
                  Error Details
                </summary>
                <pre className="text-sm text-red-400 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
