import * as React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

export type NativeCardProps = ViewProps & {
  elevated?: boolean;
};

export const NativeCard = React.forwardRef<View, NativeCardProps>(
  ({ style, elevated = true, ...props }, ref) => (
    <View
      ref={ref}
      style={[styles.base, elevated ? styles.elevated : undefined, style]}
      {...props}
    />
  )
);

NativeCard.displayName = 'NativeCard';

const styles = StyleSheet.create({
  base: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)'
  },
  elevated: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4
  }
});
