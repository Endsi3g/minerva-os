import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { View } from 'react-native';

interface NativeSegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

export function NativeSegmentedControl({ values, selectedIndex, onChange }: NativeSegmentedControlProps) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
      <SegmentedControl
        values={values}
        selectedIndex={selectedIndex}
        onChange={event => onChange(event.nativeEvent.selectedSegmentIndex)}
        tintColor="#7FA38A"
        backgroundColor="#111522"
        fontStyle={{ color: '#8A9099', fontSize: 12 }}
        activeFontStyle={{ color: '#0A0D14', fontSize: 12, fontWeight: '600' }}
      />
    </View>
  );
}
