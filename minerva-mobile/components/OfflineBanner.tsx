import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useMobileLang } from '@/lib/i18n';
import { useState } from 'react';

export function OfflineBanner() {
  const { t } = useMobileLang();
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = state.isConnected === false;
      setIsOffline(offline);
      Animated.timing(slideAnim, {
        toValue: offline ? 0 : -40,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, [slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        backgroundColor: '#B89B6A',
        paddingVertical: 6,
        paddingHorizontal: 16,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={{ color: '#0A0D14', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
        {t.errors.networkError}
      </Text>
    </Animated.View>
  );
}
