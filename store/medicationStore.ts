import * as SecureStore from 'expo-secure-store';

const PROFILE_KEY = 'medication_profile';

export type MedicationEntry = {
  medicationName: string;
  potency?: string;
  productType: string;
  methodOfIntake: string;
  courseDuration: string;
  courseDurationUnit: string;
  timesPerDay: string;
  firstDoseTime: string;
  doctorName?: string;
  doctorNumber?: string;
};

export type MedicationProfile = {
  name: string;
  age: string;
  sex: string;
  medications: MedicationEntry[];
};

export async function saveMedicationProfile(data: MedicationProfile): Promise<void> {
  await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(data));
}

export async function getMedicationProfile(): Promise<MedicationProfile | null> {
  const json = await SecureStore.getItemAsync(PROFILE_KEY);
  if (!json) return null;
  const data = JSON.parse(json);

  // Migrate old flat format to new medications array format
  if (!data.medications) {
    const { name, age, sex, medicationName, potency, productType, methodOfIntake,
            courseDuration, courseDurationUnit, timesPerDay, firstDoseTime,
            doctorName, doctorNumber } = data;
    return {
      name,
      age,
      sex,
      medications: [{
        medicationName, potency, productType, methodOfIntake,
        courseDuration, courseDurationUnit, timesPerDay, firstDoseTime,
        doctorName, doctorNumber,
      }],
    };
  }

  return data as MedicationProfile;
}

export async function clearMedicationProfile(): Promise<void> {
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}
