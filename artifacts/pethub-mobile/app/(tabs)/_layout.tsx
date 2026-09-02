import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useApp } from '@/context/AppContext';
import CustomTabBar from '@/components/CustomTabBar';

// Screens hidden from the tab bar — accessible only via the More screen.
// Setting width: 0 + overflow: hidden collapses the slot so visible tabs
// share the full width evenly instead of being squashed by invisible gaps.
const HIDDEN: React.ComponentProps<typeof Tabs.Screen>['options'] = {
  tabBarButton:    () => null,
  tabBarItemStyle: { width: 0, overflow: 'hidden' },
};

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} />
        <Label>Products</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="deliveries">
        <Icon sf={{ default: 'box.truck', selected: 'box.truck.fill' }} />
        <Label>Deliveries</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="requests">
        <Icon sf={{ default: 'arrow.triangle.swap', selected: 'arrow.triangle.swap' }} />
        <Label>Requests</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: 'ellipsis', selected: 'ellipsis.circle.fill' }} />
        <Label>More</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors      = useColors();
  const colorScheme = useColorScheme();
  const isDark      = colorScheme === 'dark';
  const isIOS       = Platform.OS === 'ios';
  const isWeb       = Platform.OS === 'web';
  const { orders, userBranch, isPrivileged } = useApp();

  const pendingCount = orders.filter(
    o => o.status === 'Order Request' && (isPrivileged || o.branch === userBranch)
  ).length;

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"          options={{ title: 'Home' }} />
      <Tabs.Screen name="products"       options={{ title: 'Stock' }} />
      <Tabs.Screen name="deliveries"     options={{ title: 'Deliver' }} />
      <Tabs.Screen name="requests"       options={{ title: 'Requests' }} />
      <Tabs.Screen name="more"           options={{ title: 'More' }} />
      <Tabs.Screen name="history"        options={{ title: 'History' }} />
      <Tabs.Screen name="inventory"      options={{ title: 'Inventory' }} />
      <Tabs.Screen name="purchase-orders" options={{ title: 'Purchase Orders' }} />
      <Tabs.Screen name="suppliers"      options={{ title: 'Suppliers' }} />
      <Tabs.Screen name="loans"          options={{ title: 'Loans' }} />
      <Tabs.Screen name="reports"        options={{ title: 'Reports' }} />
      <Tabs.Screen name="branches"       options={{ title: 'Branches' }} />
      <Tabs.Screen name="profile"        options={{ title: 'Profile' }} />
    </Tabs>
  );
}

export default function TabLayout() {
  // NativeTabLayout only registers the 5 visible triggers — hidden screens
  // (history, inventory, profile, etc.) become unresolvable via router.navigate().
  // ClassicTabLayout registers all screens with Tabs.Screen, so navigation always works.
  return <ClassicTabLayout />;
}
