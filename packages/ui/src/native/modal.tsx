import * as React from 'react';
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ModalProps as RNModalProps,
  type View as RNView,
  type ViewProps
} from 'react-native';

export interface NativeModalProps extends Omit<RNModalProps, 'visible'> {
  /** Controls whether the modal is visible. */
  isOpen: boolean;
  /** Invoked when the modal requests to be closed. */
  onClose?: () => void;
  /** Optional title displayed at the top of the modal. */
  title?: React.ReactNode;
  /** Optional footer rendered at the bottom of the modal. */
  footer?: React.ReactNode;
  /** Content rendered inside the modal. */
  children?: React.ReactNode;
}

export const NativeModal: React.FC<NativeModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  footer,
  animationType = 'fade',
  transparent = true,
  ...props
}) => {
  return (
    <RNModal
      animationType={animationType}
      transparent={transparent}
      visible={isOpen}
      onRequestClose={onClose}
      {...props}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
          {onClose ? (
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.dismissButton}>
              <Text style={styles.dismissText}>Close</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </RNModal>
  );
};

NativeModal.displayName = 'NativeModal';

export type NativeModalSectionProps = ViewProps;

export const NativeModalSection = React.forwardRef<RNView, NativeModalSectionProps>(
  ({ style, ...props }, ref) => <View ref={ref} style={[styles.section, style]} {...props} />
);
NativeModalSection.displayName = 'NativeModalSection';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24
  },
  content: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f1f5f9'
  },
  body: {
    gap: 12
  },
  footer: {
    gap: 12
  },
  section: {
    gap: 12
  },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: 'rgba(148, 163, 184, 0.2)'
  },
  dismissText: {
    color: '#e2e8f0',
    fontWeight: '600'
  }
});
