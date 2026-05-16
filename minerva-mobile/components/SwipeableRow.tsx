import { useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface SwipeAction {
  label: string;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  rightActions?: SwipeAction[];
  leftActions?: SwipeAction[];
}

export function SwipeableRow({ children, rightActions, leftActions }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  function renderActions(actions: SwipeAction[], _progress: Animated.AnimatedInterpolation<number>, direction: 'left' | 'right') {
    return (
      <View style={{ flexDirection: direction === 'left' ? 'row' : 'row-reverse' }}>
        {actions.map((action, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              swipeableRef.current?.close();
              action.onPress();
            }}
            style={{
              backgroundColor: action.color,
              justifyContent: 'center',
              alignItems: 'center',
              width: 80,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={rightActions ? (p) => renderActions(rightActions, p, 'right') : undefined}
      renderLeftActions={leftActions ? (p) => renderActions(leftActions, p, 'left') : undefined}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </Swipeable>
  );
}
