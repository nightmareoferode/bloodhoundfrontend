import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'access_token';
const SIGNUP_DATA_KEY = 'pending_signup';

const API_BASE_URL = 'http://localhost:8000';

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

// Types matching the API schema
export type ProductType = 'Tablet' | 'Capsule' | 'Liquid' | 'Injection' | 'Topical';
export type MethodOfIntake = 'Oral' | 'Intravenous' | 'Sublingual' | 'Inhalation';
export type DurationUnit = 'Days' | 'Weeks' | 'Months';

export type SignupMedication = {
  name: string;
  potency: string;
  product_type: ProductType;
  method_of_intake: MethodOfIntake;
  course_duration_value: number;
  course_duration_unit: DurationUnit;
  frequency: string;
  first_dose_time: string; // HH:MM:SS format
};

export type SignupRequest = {
  username: string;
  email?: string | null;
  phone?: string | null;
  password: string;
  medications: SignupMedication[];
};

export type SignupResponse = {
  user_id: number;
  medications: Array<SignupMedication & { rxcui: string; usa_name: string }>;
};

export type LoginRequest = {
  email?: string | null;
  phone?: string | null;
  password: string;
};

export type LoginResponse = {
  user_id: number;
};

export type PendingSignupData = {
  username: string;
  email?: string;
  phone?: string;
  password: string;
};

// Store pending signup data (username, email/phone, password) before medication entry
export async function savePendingSignup(data: PendingSignupData): Promise<void> {
  await storage.setItem(SIGNUP_DATA_KEY, JSON.stringify(data));
}

export async function getPendingSignup(): Promise<PendingSignupData | null> {
  const json = await storage.getItem(SIGNUP_DATA_KEY);
  if (!json) return null;
  return JSON.parse(json) as PendingSignupData;
}

export async function clearPendingSignup(): Promise<void> {
  await storage.deleteItem(SIGNUP_DATA_KEY);
}

// Token management
export async function saveToken(token: string): Promise<void> {
  await storage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return storage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await storage.deleteItem(TOKEN_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

// API calls
export async function signup(data: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Signup failed with status ${response.status}`;
    throw new Error(detail);
  }

  // Extract and save the token from Authorization header
  const authHeader = response.headers.get('Authorization');
  if (authHeader) {
    // Header contains the raw token (no "Bearer " prefix according to schema.md)
    await saveToken(authHeader);
  }

  return response.json();
}

export async function logout(): Promise<void> {
  await clearToken();
  await clearPendingSignup();
}

// Login API call
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const detail = errorBody.detail || `Login failed with status ${response.status}`;
    throw new Error(detail);
  }

  // Extract and save the token from Authorization header
  const authHeader = response.headers.get('Authorization');
  if (authHeader) {
    await saveToken(authHeader);
  }

  return response.json();
}

// Authenticated API request helper
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Handle token expiration
  if (response.status === 401) {
    await clearToken();
    throw new Error('Session expired - please log in again');
  }

  return response;
}
