import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { login } from '@/store/authStore';
import { fetchAndSaveUserData } from '@/store/userStore';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

function getInputType(value: string): 'email' | 'phone' | null {
  if (EMAIL_REGEX.test(value)) return 'email';
  if (PHONE_REGEX.test(value)) return 'phone';
  return null;
}

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputType = getInputType(identifier);
  const isFormValid = inputType !== null && password.length > 0;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      await login({
        email: inputType === 'email' ? identifier.trim() : null,
        phone: inputType === 'phone' ? identifier.trim() : null,
        password,
      });

      // Fetch and cache user data locally after login - this is required
      await fetchAndSaveUserData();

      router.replace('/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Email or Phone Number"
          placeholderTextColor="#A0AEC0"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#A0AEC0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        {identifier.length > 0 && inputType === null && (
          <Text style={styles.errorText}>Enter a valid email or phone number</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!isFormValid || isLoading) && styles.buttonDisabled]}
          disabled={!isFormValid || isLoading}
          onPress={handleLogin}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2B6CB0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#90B8D8',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    marginBottom: 8,
    marginTop: -8,
  },
});
