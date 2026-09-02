import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useApp } from '@/context/AppContext';

export default function Index() {
  const { userBranch, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href={userBranch ? '/tabs' : '/login'} />;
}
