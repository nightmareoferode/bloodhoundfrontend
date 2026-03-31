import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="medication-profile" options={{ title: 'Medication Profile' }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="drug-checker" options={{ title: 'Quick Reference' }} />
      <Stack.Screen name="user-profile" options={{ title: 'My Profile' }} />
      <Stack.Screen name="meds-list" options={{ title: 'Existing Medications' }} />
    </Stack>
  );
}
