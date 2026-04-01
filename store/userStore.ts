import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { authenticatedFetch, getToken, clearToken } from './authStore';

const USER_DATA_KEY = 'user_data';

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Types matching the API response from GET /users/me
export type ProductType = 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Topical';
export type MethodOfIntake = 'Oral' | 'Intravenous' | 'Sublingual' | 'Inhalation';
export type DurationUnit = 'Days' | 'Weeks' | 'Months';

export type Medication = {
  id: number;
  name: string;
  potency: string;
  product_type: ProductType;
  method_of_intake: MethodOfIntake;
  course_duration_value: number;
  course_duration_unit: DurationUnit;
  frequency: string;
  first_dose_time: string;
  user_id: number;
  usa_name: string | null;
  rxcui: string | null;
};

export type User = {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  medications: Medication[];
};

// Auth check result
export type AuthCheckResult = {
  isAuthenticated: boolean;
  user: User | null;
  error?: string;
};

// Save user data locally
export async function saveUserData(user: User): Promise<void> {
  await storage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

// Get locally cached user data
export async function getUserData(): Promise<User | null> {
  const json = await storage.getItem(USER_DATA_KEY);
  if (!json) return null;
  return JSON.parse(json) as User;
}

// Clear local user data
export async function clearUserData(): Promise<void> {
  await storage.deleteItem(USER_DATA_KEY);
}

// Fetch fresh user data from API (always fresh, no caching)
export async function fetchUserData(): Promise<User> {
  const response = await authenticatedFetch('/users/me');
  
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Failed to fetch user data: ${response.status}`;
    throw new Error(detail);
  }
  
  const user: User = await response.json();
  return user;
}

// Fetch fresh user data from API and save locally (kept for auth startup)
export async function fetchAndSaveUserData(): Promise<User> {
  const user = await fetchUserData();
  await saveUserData(user);
  return user;
}

// Update request types for PATCH /users/me
export type MedicationUpdate = {
  name: string;
  potency: string;
  product_type: ProductType;
  method_of_intake: MethodOfIntake;
  course_duration_value: number;
  course_duration_unit: DurationUnit;
  frequency: string;
  first_dose_time: string;
};

export type UserUpdateRequest = {
  username?: string;
  email?: string | null;
  phone?: string | null;
  medications?: MedicationUpdate[];
};

// Update user profile on backend (no caching, callers should refresh if needed)
export async function updateUserProfile(data: UserUpdateRequest): Promise<User> {
  const response = await authenticatedFetch('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Failed to update profile: ${response.status}`;
    throw new Error(detail);
  }

  const updatedUser: User = await response.json();
  return updatedUser;
}

// Check authentication status on app startup
// Returns whether user is authenticated and their data if so
export async function checkAuthOnStartup(): Promise<AuthCheckResult> {
  try {
    const token = await getToken();
    
    if (!token) {
      return { isAuthenticated: false, user: null };
    }
    
    // Token exists, try to fetch user data
    const user = await fetchAndSaveUserData();
    return { isAuthenticated: true, user };
  } catch (error) {
    // Token is invalid or expired - clear it
    await clearToken();
    await clearUserData();
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { isAuthenticated: false, user: null, error: errorMessage };
  }
}

// Full logout - clear all auth and user data
export async function fullLogout(): Promise<void> {
  await clearToken();
  await clearUserData();
}
