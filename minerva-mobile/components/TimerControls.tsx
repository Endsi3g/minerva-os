import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface TimerControlsProps {
  isRunning: boolean;
  elapsed: string;
  description: string;
  onStart: () => void;
  onStop: () => void;
  loading?: boolean;
}

export function TimerControls({ isRunning, elapsed, description, onStart, onStop, loading }: TimerControlsProps) {
  return (
    <View className="items-center">
      {/* Elapsed display */}
      <Text
        className="font-mono font-bold tabular-nums mb-2"
        style={{ fontSize: 56, color: isRunning ? '#7FA38A' : '#8A9099', letterSpacing: -1 }}
      >
        {elapsed}
      </Text>

      {isRunning && description ? (
        <Text className="text-fog text-sm mb-6 text-center px-4" numberOfLines={1}>{description}</Text>
      ) : (
        <Text className="text-fog/50 text-sm mb-6">No timer running</Text>
      )}

      {/* Control button */}
      <TouchableOpacity
        onPress={isRunning ? onStop : onStart}
        disabled={loading}
        className="rounded-full items-center justify-center"
        style={{
          width: 80,
          height: 80,
          backgroundColor: isRunning ? '#A86A6A' : '#7FA38A',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-sm">{isRunning ? 'Stop' : 'Start'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
