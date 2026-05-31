'use client';
import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(168,106,106,0.10)' }}
          >
            <AlertTriangle size={20} style={{ color: '#A86A6A' }} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-ivory">Something went wrong</p>
            <p className="text-xs text-fog max-w-xs">{this.state.message || 'An unexpected error occurred. Try refreshing.'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={this.reset} className="border-white/10 text-fog hover:text-ivory">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
