import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  Platform, KeyboardAvoidingView, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { ACCOUNT_PASSWORD, LEGACY_BRANCH_ACCOUNTS, type BranchAccount } from '@/data/seeds';
import { API_BASE } from '@/constants/apiConfig';

const pethubLogo = require('../assets/images/shopet-logo.jpg');

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const key = username.trim().toLowerCase();
    setLoading(true);
    setError('');
    let account: BranchAccount | null = null;
    let sessionToken: string | undefined;
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: key, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError(res.status === 401 ? 'Incorrect username or password. Please try again.' : (data.error ?? 'Unable to sign in right now.'));
        setLoading(false);
        return;
      }
      const verifiedAccount = data.account as Partial<BranchAccount> | undefined;
      if (
        !verifiedAccount ||
        typeof verifiedAccount.branch !== 'string' ||
        !verifiedAccount.branch ||
        typeof verifiedAccount.username !== 'string' ||
        !verifiedAccount.username ||
        (verifiedAccount.role !== 'branch' && verifiedAccount.role !== 'warehouse' && verifiedAccount.role !== 'president')
      ) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('The sign-in service returned an incomplete account profile. Please try again.');
        setLoading(false);
        return;
      }
      account = verifiedAccount as BranchAccount;
      sessionToken = typeof data.sessionToken === 'string' ? data.sessionToken : undefined;
    } catch {
      const legacy = LEGACY_BRANCH_ACCOUNTS.find(candidate => candidate.username === key);
      if (legacy && password === ACCOUNT_PASSWORD) {
        account = legacy;
      } else {
        setError(legacy
          ? 'Incorrect password. Connect to verify changed passwords.'
          : 'Sign-in service unavailable. New branch accounts require a connection.');
      }
    }
    if (!account) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setLoading(false);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await login(account.branch, account.username, account.role, sessionToken);
    setLoading(false);
    router.replace('/(tabs)');
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const canSubmit = username.trim().length > 0 && password.length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#0d3d2b', '#1a7a5c', '#0d3d2b']}
        style={[styles.gradient, { paddingTop: topPad + 32 }]}
      >
        {/* Brand */}
        <View style={styles.brand}>
          <Image source={pethubLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Pet Hub Shop</Text>
          <Text style={styles.appSub}>Warehouse Ordering System</Text>
          <Text style={styles.tagline}>Shop with love, no bashing</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sign In</Text>

          {/* Username */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username</Text>
            <View style={[
              styles.inputRow,
              { borderColor: error && !username ? colors.destructive : colors.border, backgroundColor: colors.background },
            ]}>
              <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                value={username}
                onChangeText={t => { setUsername(t); setError(''); }}
                placeholder="e.g. warehouse, angeles…"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                style={[styles.inputInner, { color: colors.foreground }]}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[
              styles.inputRow,
              { borderColor: error ? colors.destructive : colors.border, backgroundColor: colors.background },
            ]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
                placeholder="Enter password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                style={[styles.inputInner, { color: colors.foreground }]}
              />
              <Pressable onPress={() => setShowPassword(v => !v)} hitSlop={8} style={styles.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading || !canSubmit}
            style={({ pressed }) => [
              styles.signInBtn,
              { backgroundColor: pressed ? '#0d5c43' : colors.primary, opacity: (loading || !canSubmit) ? 0.6 : 1 },
            ]}
          >
            <Text style={[styles.signInText, { color: colors.primaryForeground }]}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, justifyContent: 'flex-end' },
  brand: { alignItems: 'center', paddingBottom: 36, gap: 4 },
  logo: { width: 100, height: 100, borderRadius: 20, marginBottom: 8 },
  appName: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  tagline: { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', marginTop: 2 },
  card: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 4 },
  cardTitle: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  inputInner: { flex: 1, paddingVertical: 13, fontSize: 15 },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  errorText: { fontSize: 12, fontWeight: '500', flex: 1 },
  signInBtn: { marginTop: 8, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  signInText: { fontSize: 16, fontWeight: '700' },
});
