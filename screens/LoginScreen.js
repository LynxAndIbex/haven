import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../data/supabase';
import { colors, radius, spacing } from '../theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const [mode,     setMode]     = React.useState('login'); // 'login' | 'signup' | 'forgot'
  const [email,    setEmail]    = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading,  setLoading]  = React.useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Login result: ', JSON.stringify({ data, error}));
    setLoading(false);
    if (error) Alert.alert('Incorrect email or password. Remember your password must be at least 6 characters.', error.message);
  };

  const handleSignup = async () => {
    if (!email || !password) return;
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Click it to activate your account, then log in.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    }
  };

  const handleForgot = async () => {
    if (!email) {
      Alert.alert('Enter your email', 'Type your email address above first.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Email sent',
        'Check your inbox for a password reset link.',
        [{ text: 'OK', onPress: () => setMode('login') }]
      );
    }
  };

  const TITLES = {
    login:  'Welcome back',
    signup: 'Create account',
    forgot: 'Reset password',
  };

  const SUBS = {
    login:  'Sign in to your Haven account',
    signup: 'Start monitoring your home\'s air quality',
    forgot: 'We\'ll send you a reset link',
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>

        {/* BRAND */}
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <View style={styles.brandRing} />
            <View style={styles.brandDot} />
          </View>
          <Text style={styles.brandName}>HAVEN</Text>
          <Text style={styles.brandTagline}>Home air quality intelligence</Text>
        </View>

        {/* CARD */}
        <View style={styles.card}>
          <Text style={styles.title}>{TITLES[mode]}</Text>
          <Text style={styles.sub}>{SUBS[mode]}</Text>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.hint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* PASSWORD */}
          {mode !== 'forgot' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.hint}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          )}

          {/* PRIMARY BUTTON */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={
              mode === 'login'  ? handleLogin  :
              mode === 'signup' ? handleSignup :
              handleForgot
            }
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.primaryBtnText}>
                  {mode === 'login'  ? 'Sign in'        :
                   mode === 'signup' ? 'Create account' :
                   'Send reset link'}
                </Text>
            }
          </TouchableOpacity>

          {/* FORGOT PASSWORD */}
          {mode === 'login' && (
            <TouchableOpacity
              onPress={() => setMode('forgot')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SWITCH MODE */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'login'  ? "Don't have an account? " :
             mode === 'signup' ? 'Already have an account? ' :
             'Remember your password? '}
          </Text>
          <TouchableOpacity
            onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            activeOpacity={0.7}
          >
            <Text style={styles.switchLink}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.cream },
  inner:            { flex: 1, padding: spacing.xl,
                      justifyContent: 'center', gap: spacing.xl },

  brand:            { alignItems: 'center', gap: spacing.sm },
  brandMark:        { width: 64, height: 64, alignItems: 'center',
                      justifyContent: 'center' },
  brandRing:        { position: 'absolute', width: 56, height: 56,
                      borderRadius: 28, borderWidth: 1.5,
                      borderColor: colors.green, opacity: 0.3 },
  brandDot:         { width: 32, height: 32, borderRadius: 16,
                      backgroundColor: colors.green },
  brandName:        { fontSize: 22, fontWeight: '600', letterSpacing: 4,
                      color: colors.green },
  brandTagline:     { fontSize: 13, color: colors.muted },

  card:             { backgroundColor: colors.white, borderRadius: radius.xl,
                      borderWidth: 1.5, borderColor: colors.border,
                      padding: spacing.xl, gap: spacing.lg },
  title:            { fontSize: 20, fontWeight: '600', color: colors.text },
  sub:              { fontSize: 13, color: colors.muted, marginTop: -spacing.sm },

  inputGroup:       { gap: 6 },
  inputLabel:       { fontSize: 12, fontWeight: '600', color: colors.muted },
  input:            { backgroundColor: colors.cream, borderRadius: radius.sm,
                      borderWidth: 1.5, borderColor: colors.border,
                      paddingHorizontal: 14, paddingVertical: 12,
                      fontSize: 14, color: colors.text },

  primaryBtn:       { backgroundColor: colors.green, borderRadius: radius.md,
                      padding: spacing.lg, alignItems: 'center' },
  primaryBtnDisabled:{ opacity: 0.6 },
  primaryBtnText:   { color: colors.white, fontSize: 15, fontWeight: '600' },

  linkText:         { fontSize: 13, color: colors.green, textAlign: 'center',
                      fontWeight: '500' },

  switchRow:        { flexDirection: 'row', justifyContent: 'center',
                      alignItems: 'center' },
  switchText:       { fontSize: 13, color: colors.muted },
  switchLink:       { fontSize: 13, color: colors.green, fontWeight: '600' },
});