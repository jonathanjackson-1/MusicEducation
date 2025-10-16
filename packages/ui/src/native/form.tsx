import * as React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
  type TextInputProps,
  type View as RNView,
  type ViewProps
} from 'react-native';

export interface NativeFormProps extends ViewProps {
  spacing?: 'none' | 'sm' | 'md' | 'lg';
}

const spacingMap: Record<NonNullable<NativeFormProps['spacing']>, number> = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16
};

export const NativeForm = React.forwardRef<RNView, NativeFormProps>(
  ({ style, spacing = 'md', children, ...props }, ref) => (
    <View ref={ref} style={[styles.form, { gap: spacingMap[spacing] }, style]} {...props}>
      {children}
    </View>
  )
);
NativeForm.displayName = 'NativeForm';

export interface NativeFormFieldProps extends ViewProps {
  label?: React.ReactNode;
  message?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  input?: React.ReactElement<TextInputProps>;
}

export const NativeFormField = React.forwardRef<RNView, NativeFormFieldProps>(
  ({ label, message, description, required, input, children, style, ...props }, ref) => (
    <View ref={ref} style={[styles.field, style]} {...props}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}>*</Text> : null}
        </Text>
      ) : null}
      {input ? React.cloneElement(input, { style: [styles.input, input.props.style] }) : null}
      {children}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  )
);
NativeFormField.displayName = 'NativeFormField';

export interface NativeTextInputProps extends TextInputProps {}

export const NativeTextInput = React.forwardRef<RNTextInput, NativeTextInputProps>(({ style, ...props }, ref) => (
  <TextInput ref={ref} style={[styles.input, style]} placeholderTextColor="rgba(148, 163, 184, 0.9)" {...props} />
));
NativeTextInput.displayName = 'NativeTextInput';

const styles = StyleSheet.create({
  form: {
    flexDirection: 'column'
  },
  field: {
    gap: 6
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0'
  },
  required: {
    color: '#f87171'
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  description: {
    fontSize: 12,
    color: '#cbd5f5'
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f87171'
  }
});
