import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import MedicationProfileForm from '@/components/forms/MedicationProfileForm';
import { useRouter } from 'expo-router';
import { getMedicationProfile, MedicationProfile, saveMedicationProfile } from '@/store/medicationStore';
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
import { fetchAndSaveUserData } from '@/store/userStore';

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
  const [existingProfile, setExistingProfile] = useState<MedicationProfile | null>(null);
  const [pendingSignup, setPendingSignup] = useState<PendingSignupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([getMedicationProfile(), getPendingSignup()])
      .then(([profile, signup]) => {
        setExistingProfile(profile);
        setPendingSignup(signup);
      })
      .finally(() => setLoading(false));
  }, []);

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

        // Try to fetch and cache user data (including medications with rxcui) from server
        try {
          await fetchAndSaveUserData();
        } catch (fetchError) {
          console.warn('Could not fetch user data:', fetchError);
          // Continue anyway - data will be fetched later
        }

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
      // No pending signup - just save profile locally (editing existing profile)
      await saveMedicationProfile(data as unknown as MedicationProfile);
      router.push('/home');
    }
  };

  // Cast existing profile to match form's expected types
  const formInitialValues = existingProfile
    ? {
        ...existingProfile,
        sex: existingProfile.sex as 'Male' | 'Female' | 'Other',
        medications: existingProfile.medications.map((med) => ({
          ...med,
          productType: med.productType as 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Topical',
          methodOfIntake: med.methodOfIntake as 'Oral' | 'Intravenous' | 'Sublingual' | 'Inhalation',
          courseDurationUnit: med.courseDurationUnit as 'days' | 'weeks' | 'months',
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
