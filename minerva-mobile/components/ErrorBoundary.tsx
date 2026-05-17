import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { captureException } from '@/lib/sentry';

interface State { hasError: boolean }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(error, { componentStack: info.componentStack ?? undefined });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0D14', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#F5F1E8', fontSize: 40, marginBottom: 16 }}>⚠️</Text>
        <Text style={{ color: '#F5F1E8', fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Text style={{ color: '#8A9099', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
          The app encountered an unexpected error.
        </Text>
        <TouchableOpacity
          onPress={() => this.setState({ hasError: false })}
          style={{ backgroundColor: '#F5F1E8', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#0A0D14', fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
