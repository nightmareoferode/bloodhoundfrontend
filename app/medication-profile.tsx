import { SafeAreaView, StyleSheet } from 'react-native';
import MedicationProfileForm from '@/components/forms/MedicationProfileForm';
import { useRouter } from 'expo-router';

export default function MedicationProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <MedicationProfileForm
        onSubmit={(data) => {
          console.log('[SmartDrugChecker] Form submitted:', data);
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
});
