import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type NativeButtonProps = PressableProps & {
  label: string;
};

export const NativeButton = React.forwardRef<Pressable, NativeButtonProps>(
  ({ label, style, ...props }, ref) => (
    <Pressable ref={ref} style={[styles.base, style]} {...props}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
);

NativeButton.displayName = 'NativeButton';

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#2563eb'
  },
  label: {
    color: '#f8fafc',
    fontWeight: '600',
    textAlign: 'center'
  }
});
