import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchAndSaveUserData, getUserData, User } from '@/store/userStore';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch fresh user data from API whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAndSaveUserData()
        .then(setUser)
        .catch(() => {
          // Fall back to cached data if API fails
          getUserData().then(setUser);
        })
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No Profile Found</Text>
          <Text style={styles.emptySubtitle}>Please log in to see your profile.</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/login')}>
            <Text style={styles.ctaButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Rx</Text>
          </View>
          <Text style={styles.headerTitle}>Medication Profile</Text>
          <Text style={styles.headerSubtitle}>Smart Drugs Detector</Text>
        </View>

        {/* User Information Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.divider} />
          <InfoRow label="Username" value={user.username} />
          <InfoRow label="Email" value={user.email || undefined} />
          <InfoRow label="Phone" value={user.phone || undefined} />
        </View>

        {/* One card per medication */}
        {user.medications.map((med, index) => {
          const courseSummary = `${med.course_duration_value} ${med.course_duration_unit}`;
          const frequencySummary = med.frequency;

          return (
            <View key={med.id} style={styles.card}>
              {user.medications.length > 1 && (
                <View style={styles.medicationIndexBadge}>
                  <Text style={styles.medicationIndexText}>Medication {index + 1}</Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Medication Details</Text>
              <View style={styles.divider} />
              <InfoRow label="Medication Name" value={med.name} />
              {med.usa_name && <InfoRow label="USA Name" value={med.usa_name} />}
              <InfoRow label="Potency" value={med.potency} />
              <InfoRow label="Product Type" value={med.product_type} />
              <InfoRow label="Method of Intake" value={med.method_of_intake} />

              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Course & Schedule</Text>
              <View style={styles.divider} />
              <InfoRow label="Course Duration" value={courseSummary} />
              <InfoRow label="Frequency" value={frequencySummary} />
              <InfoRow label="First Dose Time" value={med.first_dose_time} />
            </View>
          );
        })}

        {user.medications.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.emptyMedsText}>No medications saved yet.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/medication-profile')}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>
          ⚕ All data is processed securely and never stored without consent.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const COLORS = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  label: '#1C2B3A',
  sublabel: '#5F6B78',
  border: '#D9E2EC',
  divider: '#E8EEF4',
  shadow: '#1A2B4B',
  white: '#FFFFFF',
  badgeBg: '#EAF2FF',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.sublabel,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Medication index badge
  medicationIndexBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.badgeBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
  },
  medicationIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 12,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.sublabel,
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
    flex: 1,
    textAlign: 'right',
  },

  // Edit button
  editButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Empty state
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.sublabel,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyMedsText: {
    fontSize: 14,
    color: COLORS.sublabel,
    textAlign: 'center',
    paddingVertical: 12,
  },
  ctaButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Footer
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.sublabel,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
});
