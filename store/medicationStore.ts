import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PROFILE_KEY = 'medication_profile';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    return SecureStore.deleteItemAsync(key);
  },
};

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
  await storage.setItem(PROFILE_KEY, JSON.stringify(data));
}

export async function getMedicationProfile(): Promise<MedicationProfile | null> {
  const json = await storage.getItem(PROFILE_KEY);
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
  await storage.deleteItem(PROFILE_KEY);
}
