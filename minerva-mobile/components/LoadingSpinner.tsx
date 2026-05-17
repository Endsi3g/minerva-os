import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0D14', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <ActivityIndicator color="#7FA38A" size="large" />
      {message ? <Text style={{ color: '#8A9099', fontSize: 14 }}>{message}</Text> : null}
    </View>
  );
}
