import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, Alert, Platform, KeyboardAvoidingView, ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { type BranchAccount } from '@/data/seeds';

interface FormState {
  branch: string;
  username: string;
  password: string;
  address: string;
}

const EMPTY_FORM: FormState = { branch: '', username: '', password: '', address: '' };

export default function BranchesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { branches, createBranch, isPrivileged } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Robust safe area handling that accounts for both native bounds and web edge cases
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;
  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 34) : insets.bottom;

  if (!isPrivileged) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={[styles.lockText, { color: colors.mutedForeground }]}>
          Branch management is only accessible to{'\n'}Warehouse and President accounts.
        </Text>
      </View>
    );
  }

  const sortedBranches = [...(branches || [])].sort((a: BranchAccount, b: BranchAccount) => 
    a.branch.localeCompare(b.branch)
  );

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    const branchTrimmed = form.branch.trim();
    const usernameTrimmed = form.username.trim();
    
    if (!branchTrimmed) e.branch = 'Required';
    if (!usernameTrimmed) e.username = 'Required';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 6) e.password = 'Must be at least 6 characters';

    const isDuplicateBranch = (branches || []).some((b: BranchAccount) => 
      b.branch.toLowerCase() === branchTrimmed.toLowerCase()
    );
    const isDuplicateUser = (branches || []).some((b: BranchAccount) => 
      b.username.toLowerCase() === usernameTrimmed.toLowerCase()
    );

    if (isDuplicateBranch && !e.branch) e.branch = 'Branch name already exists';
    if (isDuplicateUser && !e.username) e.username = 'Username already exists';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    
    try {
      await createBranch({
        branch: form.branch.trim(),
        username: form.username.trim(),
        password: form.password,
        address: form.address.trim() || undefined,
      });
      setShowModal(false);
      Alert.alert('Success', 'Branch account created successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not create branch. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    if (role === 'president') return '#8b5cf6';
    if (role === 'warehouse') return '#3b82f6';
    return '#10b981';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'president') return 'President';
    if (role === 'warehouse') return 'Warehouse';
    return 'Branch';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'president') return 'star';
    if (role === 'warehouse') return 'box';
    return 'map-pin';
  };

  const renderItem = ({ item }: { item: BranchAccount }) => {
    const roleColor = getRoleColor(item.role);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: roleColor + '15' }]}>
          <Feather name={getRoleIcon(item.role) as any} size={20} color={roleColor} />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.branchName, { color: colors.foreground }]} numberOfLines={1}>
            {item.branch}
          </Text>
          <View style={styles.roleRow}>
            <Text style={[styles.usernameText, { color: colors.mutedForeground }]} numberOfLines={1}>
              @{item.username}
            </Text>
            <View style={[styles.dot, { backgroundColor: colors.border }]} />
            <Text style={[styles.roleText, { color: roleColor }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
          {!!item.address && (
            <View style={styles.addressRow}>
              <Feather name="map" size={12} color={colors.mutedForeground} />
              <Text style={[styles.addressText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Branches</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {sortedBranches.length} {sortedBranches.length === 1 ? 'account' : 'accounts'}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: colors.primary }]} 
          onPress={openAdd}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedBranches}
        keyExtractor={item => item.username}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 100 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="git-branch" size={40} color={colors.mutedForeground} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No branch accounts</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Tap "New" to create one</Text>
          </View>
        }
      />

      <Modal 
        visible={showModal} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={() => !isSaving && setShowModal(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Branch Account</Text>
            <TouchableOpacity 
              onPress={() => setShowModal(false)} 
              style={styles.closeBtn}
              disabled={isSaving}
            >
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.keyboardView} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView 
              contentContainerStyle={styles.modalBody} 
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Branch Name</Text>
                <TextInput
                  value={form.branch}
                  onChangeText={v => setForm(prev => ({ ...prev, branch: v }))}
                  style={[
                    styles.input, 
                    { 
                      borderColor: errors.branch ? colors.destructive : colors.border, 
                      color: colors.foreground, 
                      backgroundColor: colors.card 
                    }
                  ]}
                  placeholder="e.g. Downtown Clinic"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  editable={!isSaving}
                />
                {errors.branch && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.branch}</Text>}
              </View>
              
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username</Text>
                <TextInput
                  value={form.username}
                  onChangeText={v => setForm(prev => ({ ...prev, username: v }))}
                  style={[
                    styles.input, 
                    { 
                      borderColor: errors.username ? colors.destructive : colors.border, 
                      color: colors.foreground, 
                      backgroundColor: colors.card 
                    }
                  ]}
                  placeholder="e.g. downtown_admin"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSaving}
                />
                {errors.username && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.username}</Text>}
              </View>
              
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password</Text>
                <TextInput
                  value={form.password}
                  onChangeText={v => setForm(prev => ({ ...prev, password: v }))}
                  style={[
                    styles.input, 
                    { 
                      borderColor: errors.password ? colors.destructive : colors.border, 
                      color: colors.foreground, 
                      backgroundColor: colors.card 
                    }
                  ]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                  editable={!isSaving}
                />
                {errors.password && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.password}</Text>}
              </View>
              
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Address (Optional)</Text>
                <TextInput
                  value={form.address}
                  onChangeText={v => setForm(prev => ({ ...prev, address: v }))}
                  style={[
                    styles.input, 
                    { 
                      borderColor: colors.border, 
                      color: colors.foreground, 
                      backgroundColor: colors.card 
                    }
                  ]}
                  placeholder="e.g. 123 Main St, City"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="words"
                  editable={!isSaving}
                />
              </View>
              
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <Feather name={isSaving ? 'loader' : 'check'} size={18} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {isSaving ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  lockText: { fontSize: 15, textAlign: 'center', lineHeight: 24, fontWeight: '500' },
  
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: '500' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 4 },
  branchName: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  usernameText: { fontSize: 14, fontWeight: '500' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addressText: { fontSize: 13, fontWeight: '500' },
  
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  emptySubText: { fontSize: 15, fontWeight: '500' },
  
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 24, paddingBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  closeBtn: { padding: 4, margin: -4 },
  modalBody: { padding: 24, gap: 20 },
  
  field: { marginBottom: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  input: {
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16,
    fontSize: 16, fontWeight: '500',
  },
  errorText: { fontSize: 13, marginTop: 8, fontWeight: '600' },
  
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18, borderRadius: 16, marginTop: 12,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: -0.2 },
});
