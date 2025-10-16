import { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export function SignInScreen() {
  const { requestSignInLink, lastMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.includes('@')) {
      Alert.alert('Almost there', 'Enter a valid email address to receive a magic link.');
      return;
    }
    setSubmitting(true);
    try {
      const link = await requestSignInLink(email);
      Alert.alert('Magic link sent', 'Check your email and open the link on this device.');
      console.log('Development magic link:', link);
    } catch (error) {
      Alert.alert('Unable to send link', 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  }, [email, requestSignInLink]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Soundstudio</Text>
        <Text style={styles.subtitle}>Sign in with a magic link</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          placeholderTextColor="#64748b"
          value={email}
          onChangeText={setEmail}
        />
        <Pressable
          onPress={isSubmitting ? undefined : handleSubmit}
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>{isSubmitting ? 'Sending…' : 'Email me a link'}</Text>
        </Pressable>
        {lastMagicLink ? (
          <Text style={styles.hint}>Last link: {lastMagicLink}</Text>
        ) : (
          <Text style={styles.hint}>We&apos;ll email you a link to open in this app.</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 24,
    padding: 24,
    gap: 16
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    color: '#94a3b8'
  },
  input: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    padding: 14,
    color: '#f8fafc',
    backgroundColor: 'rgba(15, 23, 42, 0.5)'
  },
  button: {
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonLabel: {
    color: '#0f172a',
    fontWeight: '700'
  },
  buttonDisabled: {
    opacity: 0.6
  },
  hint: {
    color: '#64748b',
    fontSize: 12
  }
});
