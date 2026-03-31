import { SafeAreaView, StyleSheet } from 'react-native';
import MedicationProfileForm from '@/components/forms/MedicationProfileForm';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <MedicationProfileForm
        onSubmit={(data) => {
          console.log('[SmartDrugChecker] Form submitted:', data);
          // TODO: pass to drug analysis logic
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
