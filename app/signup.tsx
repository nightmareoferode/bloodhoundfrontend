import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,15}$/;

function getContactType(value: string): 'email' | 'phone' | 'invalid' | 'empty' {
  if (!value) return 'empty';
  if (EMAIL_REGEX.test(value)) return 'email';
  if (PHONE_REGEX.test(value)) return 'phone';
  return 'invalid';
}

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');

  const contactType = getContactType(contact);
  const contactError = contactType === 'invalid' ? 'Enter a valid email or phone number' : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#A0AEC0"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, contactError ? styles.inputError : null]}
          placeholder="Email or Phone Number"
          placeholderTextColor="#A0AEC0"
          value={contact}
          onChangeText={setContact}
          keyboardType={contactType === 'phone' ? 'phone-pad' : 'email-address'}
          autoCapitalize="none"
        />
        {contactError && <Text style={styles.errorText}>{contactError}</Text>}
        {contactType === 'email' && <Text style={styles.hintText}>Email detected</Text>}
        {contactType === 'phone' && <Text style={styles.hintText}>Phone number detected</Text>}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#A0AEC0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, (contactType === 'invalid' || contactType === 'empty') ? styles.buttonDisabled : null]}
          onPress={() => {
            if (contactType === 'email' || contactType === 'phone') {
              router.push('/medication-profile');
            }
          }}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
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
    opacity: 0.5,
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  hintText: {
    color: '#38A169',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
});
