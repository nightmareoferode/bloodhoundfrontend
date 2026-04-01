import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchUserData } from '../store/userStore';
import { lookupRxNorm, checkQuickReference, QuickReferenceResult } from '../store/quickReferenceStore';

export default function DrugCheckerScreen() {
  const router = useRouter();
  const [medicineName, setMedicineName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedName = medicineName.trim();
    if (!trimmedName) {
      setError('Please enter a medicine name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Look up the medicine in RxNorm to get rxcui and usa_name
      const rxNormResult = await lookupRxNorm(trimmedName);
      if (!rxNormResult) {
        setError(`No RxNorm match found for "${trimmedName}". Please check the spelling.`);
        setLoading(false);
        return;
      }

      // 2. Get user's current medications (fresh from API)
      const userData = await fetchUserData();
      if (!userData.medications || userData.medications.length === 0) {
        setError('You have no medications saved. Please add medications to your profile first.');
        setLoading(false);
        return;
      }

      // Filter to medications that have rxcui data
      const medicationsWithRxcui = userData.medications.filter(
        (med) => med.rxcui && med.usa_name
      );

      if (medicationsWithRxcui.length === 0) {
        setError('Your medications do not have RxNorm data. Please update your profile.');
        setLoading(false);
        return;
      }

      // 3. Check interactions with ALL medications in PARALLEL
      const interactionPromises = medicationsWithRxcui.map(async (userMed) => {
        try {
          const interactionResult = await checkQuickReference(
            {
              name: trimmedName,
              rxcui: rxNormResult.rxcui,
              usa_name: rxNormResult.usa_name,
            },
            {
              name: userMed.name,
              rxcui: userMed.rxcui!,
              usa_name: userMed.usa_name!,
            }
          );
          return {
            userMedication: {
              name: userMed.name,
              usa_name: userMed.usa_name,
              rxcui: userMed.rxcui,
            },
            result: interactionResult,
          };
        } catch (err) {
          console.warn(`Failed to check interaction with ${userMed.name}:`, err);
          return null; // Return null for failed checks
        }
      });

      // Wait for all parallel requests to complete
      const settledResults = await Promise.all(interactionPromises);
      
      // Filter out failed (null) results
      const results = settledResults.filter(
        (r): r is NonNullable<typeof r> => r !== null
      );

      if (results.length === 0) {
        setError('Could not analyze interactions with your medications. Please try again.');
        setLoading(false);
        return;
      }

      // 4. Navigate to results page with the data
      router.push({
        pathname: '/quick-reference-results',
        params: {
          inputMedicine: JSON.stringify({
            name: trimmedName,
            rxcui: rxNormResult.rxcui,
            usa_name: rxNormResult.usa_name,
          }),
          results: JSON.stringify(results),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.header}>Quick Reference</Text>
        <Text style={styles.subheader}>
          Check for interactions between a medicine and your current medications
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Input name of medicine</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ibuprofen, Aspirin, Metformin..."
            placeholderTextColor="#A0AEC0"
            value={medicineName}
            onChangeText={(text) => {
              setMedicineName(text);
              setError(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Check Interactions</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A202C',
  },
  errorBox: {
    backgroundColor: '#FED7D7',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#2B6CB0',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
