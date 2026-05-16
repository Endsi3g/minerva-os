import { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 25,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={40}
            tint="dark"
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <Animated.View
              style={{ transform: [{ translateY: slideAnim }] }}
            >
              <TouchableWithoutFeedback>
                <View style={{
                  backgroundColor: '#171C2A',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: SCREEN_HEIGHT * 0.85,
                  borderTopWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}>
                  <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
                  {title ? (
                    <Text style={{ color: '#F5F1E8', fontSize: 16, fontWeight: '600', padding: 16, paddingBottom: 8 }}>
                      {title}
                    </Text>
                  ) : null}
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: title ? 0 : 16 }}>
                    {children}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </BlurView>
        ) : (
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <TouchableWithoutFeedback>
                <View style={{
                  backgroundColor: '#171C2A',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  maxHeight: SCREEN_HEIGHT * 0.85,
                }}>
                  <View style={{ width: 36, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, alignSelf: 'center', marginTop: 12 }} />
                  {title ? (
                    <Text style={{ color: '#F5F1E8', fontSize: 16, fontWeight: '600', padding: 16, paddingBottom: 8 }}>
                      {title}
                    </Text>
                  ) : null}
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingTop: title ? 0 : 16 }}>
                    {children}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </View>
        )}
      </TouchableWithoutFeedback>
    </Modal>
  );
}
