import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { fetchUserData, Medication } from '@/store/userStore';

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function MedDetailModal({
  med,
  visible,
  onClose,
}: {
  med: Medication;
  visible: boolean;
  onClose: () => void;
}) {
  const courseSummary = `${med.course_duration_value} ${med.course_duration_unit}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{med.name}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Medication Details</Text>
            <View style={styles.divider} />
            <InfoRow label="Name" value={med.name} />
            {med.usa_name && <InfoRow label="USA Name" value={med.usa_name} />}
            <InfoRow label="Potency" value={med.potency} />
            <InfoRow label="Product Type" value={med.product_type} />
            <InfoRow label="Method of Intake" value={med.method_of_intake} />

            <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Course & Schedule</Text>
            <View style={styles.divider} />
            <InfoRow label="Duration" value={courseSummary} />
            <InfoRow label="Frequency" value={med.frequency} />
            <InfoRow label="First Dose" value={med.first_dose_time} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MedCard({
  med,
  onPress,
}: {
  med: Medication;
  onPress: () => void;
}) {
  const potencyDisplay = med.potency ? ` · ${med.potency}` : '';
  const courseSummary = `${med.course_duration_value} ${med.course_duration_unit}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardLeft}>
        <View style={styles.rxBadge}>
          <Text style={styles.rxBadgeText}>Rx</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{med.name}{potencyDisplay}</Text>
        <Text style={styles.cardSub}>{med.product_type} · {med.method_of_intake}</Text>
        <Text style={styles.cardMeta}>{courseSummary} · {med.frequency} · first dose {med.first_dose_time}</Text>
      </View>
      <Text style={styles.cardChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function MedsListScreen() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Medication | null>(null);

  // Always fetch fresh user data from API when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserData()
        .then((user) => setMedications(user.medications))
        .catch((err) => {
          console.error('Failed to fetch medications:', err);
          setMedications([]);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Existing Medications</Text>
        <Text style={styles.pageSubtitle}>Tap a card to view full details</Text>

        {medications.length > 0 ? (
          medications.map((med) => (
            <MedCard key={med.id} med={med} onPress={() => setSelected(med)} />
          ))
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No medications saved</Text>
            <Text style={styles.emptySubtitle}>
              Add medications to your profile to see them here.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/medication-profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaButtonText}>Add Medication</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {selected && (
        <MedDetailModal
          med={selected}
          visible={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </SafeAreaView>
  );
}

const COLORS = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  primary: '#1A73E8',
  label: '#1C2B3A',
  sublabel: '#5F6B78',
  border: '#D9E2EC',
  divider: '#E8EEF4',
  shadow: '#1A2B4B',
  white: '#FFFFFF',
  badgeBg: '#EAF2FF',
  badgeText: '#1A73E8',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.label,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: COLORS.sublabel,
    marginBottom: 24,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: { marginRight: 14 },
  rxBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  cardBody: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    marginBottom: 3,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.sublabel,
  },
  cardChevron: {
    fontSize: 22,
    color: COLORS.sublabel,
    marginLeft: 8,
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.label,
    flex: 1,
  },
  modalClose: {
    fontSize: 18,
    color: COLORS.sublabel,
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Sections inside modal
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitleSpaced: { marginTop: 20 },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
