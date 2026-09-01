import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable, FlatList,
  TextInput, Alert, Platform, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PaymentMethod = 'Cash' | 'Bank/Cheque' | 'Loan';
type Terms = '30 Days' | 'No Due';

const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Bank/Cheque', 'Loan'];
const TERMS_OPTIONS: Terms[] = ['30 Days', 'No Due'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CartSheet({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cart, updateCartQty, removeFromCart, clearCart, cartTotal, submitOrder } = useApp();
  const [priority, setPriority] = useState<'Standard' | 'Urgent'>('Standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [terms, setTerms] = useState<Terms>('30 Days');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    const ref = await submitOrder(priority, paymentMethod, terms, notes.trim() || undefined);
    setIsSubmitting(false);
    const isPending = ref.startsWith('PENDING-');
    if (isPending) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setNotes('');
      setPriority('Standard');
      setPaymentMethod('Cash');
      setTerms('30 Days');
      onClose();
      Alert.alert(
        'Order Queued',
        'The warehouse server is unreachable right now. Your order was saved locally and will be sent automatically once the connection is restored.',
      );
    } else if (ref) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotes('');
      setPriority('Standard');
      setPaymentMethod('Cash');
      setTerms('30 Days');
      onClose();
      Alert.alert('Order Submitted', `Order ${ref} has been sent to the warehouse.`);
    }
  };

  const fmt = (n: number) =>
    '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Cart</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {cart.length > 0 && (
              <Pressable onPress={() => { clearCart(); }}>
                <Text style={[styles.clearBtn, { color: colors.destructive }]}>Clear</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="shopping-cart" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Cart is empty</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Items */}
            {cart.map(item => (
              <View key={item.product.id} style={[styles.item, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={[styles.itemPrice, { color: colors.accent }]}>
                    {fmt(item.product.price)} / {item.product.unit}
                  </Text>
                </View>
                <View style={styles.qtyRow}>
                  <Pressable
                    onPress={() => updateCartQty(item.product.id, item.qty - 1)}
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="minus" size={14} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.qtyNum, { color: colors.foreground }]}>{item.qty}</Text>
                  <Pressable
                    onPress={() => updateCartQty(item.product.id, item.qty + 1)}
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={14} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            ))}

            {/* Priority */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>Priority</Text>
              <View style={styles.optionRow}>
                {(['Standard', 'Urgent'] as const).map(p => (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.optionBtn,
                      {
                        borderColor: priority === p ? colors.primary : colors.border,
                        backgroundColor: priority === p ? colors.primary : colors.card,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: priority === p ? colors.primaryForeground : colors.mutedForeground },
                    ]}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>Payment Method</Text>
              <View style={styles.optionRow}>
                {PAYMENT_METHODS.map(m => (
                  <Pressable
                    key={m}
                    onPress={() => setPaymentMethod(m)}
                    style={[
                      styles.optionBtn,
                      {
                        borderColor: paymentMethod === m ? colors.primary : colors.border,
                        backgroundColor: paymentMethod === m ? colors.primary : colors.card,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: paymentMethod === m ? colors.primaryForeground : colors.mutedForeground },
                      { fontSize: 12 },
                    ]}>
                      {m}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Terms */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>Terms</Text>
              <View style={styles.optionRow}>
                {TERMS_OPTIONS.map(t => (
                  <Pressable
                    key={t}
                    onPress={() => setTerms(t)}
                    style={[
                      styles.optionBtn,
                      {
                        borderColor: terms === t ? colors.primary : colors.border,
                        backgroundColor: terms === t ? colors.primary : colors.card,
                      },
                    ]}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: terms === t ? colors.primaryForeground : colors.mutedForeground },
                    ]}>
                      {t}
                    </Text>
                    {t === 'No Due' && (
                      <Text style={[styles.optionSub, { color: terms === t ? colors.primaryForeground + 'cc' : colors.mutedForeground + '88' }]}>
                        No due date
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.foreground }]}>Notes (optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Special instructions…"
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                style={[styles.notesInput, {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                }]}
              />
            </View>

            {/* Total */}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Order Total</Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>{fmt(cartTotal)}</Text>
            </View>
          </ScrollView>
        )}

        {/* Submit */}
        {cart.length > 0 && (
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: pressed || isSubmitting ? colors.primary + 'dd' : colors.primary },
            ]}
          >
            <Feather name="send" size={18} color={colors.primaryForeground} />
            <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
              {isSubmitting ? 'Submitting…' : 'Submit Order'}
            </Text>
          </Pressable>
        )}
      </View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create;
const styles = S({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    flex: 1,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  clearBtn: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 15 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  itemName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  itemPrice: { fontSize: 12, fontWeight: '500' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  section: { marginTop: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  optionSub: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  notesInput: {
    borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14,
    minHeight: 70, textAlignVertical: 'top',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, marginTop: 16, borderTopWidth: 1 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 18, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginTop: 16, paddingVertical: 16, borderRadius: 12,
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});
