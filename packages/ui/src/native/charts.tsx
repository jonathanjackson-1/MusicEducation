import * as React from 'react';
import { StyleSheet, Text, View, type View as RNView, type ViewProps } from 'react-native';

export interface NativeChartPlaceholderProps extends ViewProps {
  message?: string;
}

export const NativeChartPlaceholder = React.forwardRef<RNView, NativeChartPlaceholderProps>(
  ({ style, message = 'Charts are currently web-only.', ...props }, ref) => (
    <View ref={ref} style={[styles.container, style]} {...props}>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
);
NativeChartPlaceholder.displayName = 'NativeChartPlaceholder';

export const NativeChartContainer = NativeChartPlaceholder;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  message: {
    color: 'rgba(148, 163, 184, 0.9)',
    fontSize: 14,
    textAlign: 'center'
  }
});
