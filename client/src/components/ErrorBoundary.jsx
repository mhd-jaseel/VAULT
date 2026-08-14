import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an unhandled UI error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-3xl p-8 shadow-xs space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-bold">
                SYSTEM ERROR
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-neutral-900">
                Something went wrong
              </h1>
              <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                We couldn't load this page. Please try again or return to the store homepage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 btn-gold text-xs !py-3 uppercase font-mono font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} /> Try Again
              </button>
              <a
                href="/"
                className="flex-1 btn-dark text-xs !py-3 uppercase font-mono font-bold tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Home size={13} /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
