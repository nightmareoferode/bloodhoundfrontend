import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import MedicationProfileForm from '@/components/forms/MedicationProfileForm';
import { useRouter } from 'expo-router';
import { getMedicationProfile, MedicationProfile, saveMedicationProfile } from '@/store/medicationStore';

export default function MedicationProfileScreen() {
  const router = useRouter();
  const [existingProfile, setExistingProfile] = useState<MedicationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMedicationProfile()
      .then(setExistingProfile)
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

  return (
    <SafeAreaView style={styles.container}>
      <MedicationProfileForm
        initialValues={existingProfile ?? undefined}
        onSubmit={async (data) => {
          await saveMedicationProfile(data as MedicationProfile);
          router.push('/home');
        }}
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
