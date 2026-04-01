import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import MedicationProfileForm from '@/components/forms/MedicationProfileForm';
import { useFocusEffect, useRouter } from 'expo-router';
import { MedicationProfile, saveMedicationProfile } from '@/store/medicationStore';
import {
  clearPendingSignup,
  DurationUnit,
  getPendingSignup,
  MethodOfIntake,
  PendingSignupData,
  ProductType,
  signup,
  SignupMedication,
} from '@/store/authStore';
import { fetchUserData, MedicationUpdate, updateUserProfile, User } from '@/store/userStore';

// Map form duration units (lowercase) to API format (capitalized)
function mapDurationUnit(unit: string): DurationUnit {
  const map: Record<string, DurationUnit> = {
    days: 'Days',
    weeks: 'Weeks',
    months: 'Months',
  };
  return map[unit] || 'Days';
}

// Convert form medication data to API format
function transformMedication(med: {
  medicationName: string;
  potency?: string;
  productType: string;
  methodOfIntake: string;
  courseDuration: string;
  courseDurationUnit: string;
  timesPerDay: string;
  firstDoseTime: string;
}): SignupMedication {
  // Convert HH:MM to HH:MM:SS
  const time = med.firstDoseTime.includes(':')
    ? med.firstDoseTime.length === 5
      ? `${med.firstDoseTime}:00`
      : med.firstDoseTime
    : '08:00:00';

  return {
    name: med.medicationName,
    potency: med.potency || '0mg',
    product_type: med.productType as ProductType,
    method_of_intake: med.methodOfIntake as MethodOfIntake,
    course_duration_value: parseInt(med.courseDuration, 10),
    course_duration_unit: mapDurationUnit(med.courseDurationUnit),
    frequency: `${med.timesPerDay} times daily`,
    first_dose_time: time,
  };
}

export default function MedicationProfileScreen() {
  const router = useRouter();
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [pendingSignup, setPendingSignup] = useState<PendingSignupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      // Always fetch fresh data from API
      Promise.all([
        fetchUserData().catch(() => null), // May fail if not logged in (new signup)
        getPendingSignup(),
      ])
        .then(([user, signup]) => {
          setExistingUser(user);
          setPendingSignup(signup);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1A73E8" />
        </View>
      </SafeAreaView>
    );
  }

  const handleSubmit = async (data: MedicationProfile) => {
    // If we have pending signup data, this is a new user registration
    if (pendingSignup) {
      setSubmitting(true);
      try {
        const medications = data.medications.map(transformMedication);

        await signup({
          username: pendingSignup.username,
          email: pendingSignup.email || null,
          phone: pendingSignup.phone || null,
          password: pendingSignup.password,
          medications,
        });

        // Clear pending signup data after successful registration
        await clearPendingSignup();

        // Save profile locally for future reference
        await saveMedicationProfile(data);

        router.replace('/home');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
        Alert.alert('Signup Error', message);
      } finally {
        setSubmitting(false);
      }
    } else {
      // No pending signup - update existing profile on backend
      setSubmitting(true);
      try {
        const medications: MedicationUpdate[] = data.medications.map(transformMedication);
        
        // Send PATCH to backend and update local cache
        await updateUserProfile({ medications });
        
        // Also save to medicationStore for form state
        await saveMedicationProfile(data as unknown as MedicationProfile);
        
        router.push('/home');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
        Alert.alert('Update Error', message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Helper to convert API duration unit to form format (lowercase)
  function mapDurationUnitToForm(unit: string): 'days' | 'weeks' | 'months' {
    const map: Record<string, 'days' | 'weeks' | 'months'> = {
      Days: 'days',
      Weeks: 'weeks',
      Months: 'months',
    };
    return map[unit] || 'days';
  }

  // Helper to extract times per day from frequency string like "2 times daily"
  function extractTimesPerDay(frequency: string): string {
    const match = frequency.match(/(\d+)/);
    return match ? match[1] : '1';
  }

  // Convert User data (from API/userStore) to form format
  const formInitialValues = existingUser
    ? {
        name: existingUser.username,
        age: '', // Not stored in API, will be empty
        sex: 'Other' as 'Male' | 'Female' | 'Other',
        medications: existingUser.medications.map((med) => ({
          medicationName: med.name,
          potency: med.potency || '',
          productType: med.product_type as 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Topical',
          methodOfIntake: med.method_of_intake as 'Oral' | 'Intravenous' | 'Sublingual' | 'Inhalation',
          courseDuration: String(med.course_duration_value),
          courseDurationUnit: mapDurationUnitToForm(med.course_duration_unit),
          timesPerDay: extractTimesPerDay(med.frequency),
          firstDoseTime: med.first_dose_time.slice(0, 5), // Convert HH:MM:SS to HH:MM
          doctorName: '',
          doctorNumber: '',
        })),
      }
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <MedicationProfileForm
        initialValues={formInitialValues}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
