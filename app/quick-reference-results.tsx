import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuickReferenceResult } from '../store/quickReferenceStore';

type InteractionResult = {
  userMedication: {
    name: string;
    usa_name: string | null;
    rxcui: string | null;
  };
  result: QuickReferenceResult;
};

type InputMedicine = {
  name: string;
  rxcui: string;
  usa_name: string;
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'Critical':
      return '#C53030';
    case 'Warning':
      return '#D69E2E';
    case 'Safe':
      return '#38A169';
    case 'Synergistic':
      return '#3182CE';
    default:
      return '#718096';
  }
}

function getStatusBackground(status: string): string {
  switch (status) {
    case 'Critical':
      return '#FED7D7';
    case 'Warning':
      return '#FEFCBF';
    case 'Safe':
      return '#C6F6D5';
    case 'Synergistic':
      return '#BEE3F8';
    default:
      return '#E2E8F0';
  }
}

function SeverityBar({ value }: { value: number }) {
  const percentage = Math.min(100, Math.max(0, value * 10));
  const color =
    value <= 3 ? '#38A169' : value <= 6 ? '#D69E2E' : '#C53030';

  return (
    <View style={styles.severityContainer}>
      <View style={styles.severityBarBg}>
        <View style={[styles.severityBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.severityValue, { color }]}>{value}/10</Text>
    </View>
  );
}

function InteractionCard({ interaction, inputMedicine }: { interaction: InteractionResult; inputMedicine: InputMedicine }) {
  const { userMedication, result } = interaction;
  const statusColor = getStatusColor(result.status);
  const statusBg = getStatusBackground(result.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.medicationPair}>
          <Text style={styles.medicineName}>{inputMedicine.name}</Text>
          <Text style={styles.vsText}>vs</Text>
          <Text style={styles.medicineName}>{userMedication.name}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{result.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Severity</Text>
        <SeverityBar value={result.severity_index} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.sectionText}>{result.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mechanism</Text>
        <Text style={styles.sectionText}>{result.mechanism}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Evidence Match</Text>
        <View style={styles.evidenceRow}>
          <View style={[styles.evidenceDot, { backgroundColor: result.evidence_match ? '#38A169' : '#E53E3E' }]} />
          <Text style={styles.sectionText}>
            {result.evidence_match ? 'Supported by real-world data' : 'Theoretical, limited real-world data'}
          </Text>
        </View>
      </View>

      <View style={[styles.section, styles.recommendationSection]}>
        <Text style={styles.sectionLabel}>Recommendation</Text>
        <Text style={[styles.recommendationText, { color: statusColor }]}>{result.recommendation}</Text>
      </View>
    </View>
  );
}

export default function QuickReferenceResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ inputMedicine: string; results: string }>();

  let inputMedicine: InputMedicine | null = null;
  let interactions: InteractionResult[] = [];

  try {
    if (params.inputMedicine) {
      inputMedicine = JSON.parse(params.inputMedicine);
    }
    if (params.results) {
      interactions = JSON.parse(params.results);
    }
  } catch (e) {
    console.error('Failed to parse results:', e);
  }

  if (!inputMedicine || interactions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No results to display</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Sort by severity (highest first)
  const sortedInteractions = [...interactions].sort(
    (a, b) => b.result.severity_index - a.result.severity_index
  );

  // Find the highest severity for summary
  const maxSeverity = Math.max(...interactions.map((i) => i.result.severity_index));
  const criticalCount = interactions.filter((i) => i.result.status === 'Critical').length;
  const warningCount = interactions.filter((i) => i.result.status === 'Warning').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={styles.header}>Interaction Results</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Checked: <Text style={styles.summaryHighlight}>{inputMedicine.name}</Text>
          </Text>
          <Text style={styles.summarySubtitle}>
            ({inputMedicine.usa_name} • RxCUI: {inputMedicine.rxcui})
          </Text>
          <View style={styles.summaryStats}>
            <Text style={styles.summaryStatText}>
              Compared against {interactions.length} medication{interactions.length !== 1 ? 's' : ''}
            </Text>
            {criticalCount > 0 && (
              <Text style={[styles.summaryStatText, { color: '#C53030' }]}>
                ⚠️ {criticalCount} critical interaction{criticalCount !== 1 ? 's' : ''}
              </Text>
            )}
            {warningCount > 0 && (
              <Text style={[styles.summaryStatText, { color: '#D69E2E' }]}>
                ⚡ {warningCount} warning{warningCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {sortedInteractions.map((interaction, index) => (
          <InteractionCard
            key={`${interaction.userMedication.rxcui}-${index}`}
            interaction={interaction}
            inputMedicine={inputMedicine!}
          />
        ))}

        <TouchableOpacity style={styles.doneButton} onPress={() => router.push('/home')}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  summaryHighlight: {
    color: '#2B6CB0',
    fontWeight: '700',
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#718096',
    marginTop: 4,
    marginBottom: 12,
  },
  summaryStats: {
    gap: 4,
  },
  summaryStatText: {
    fontSize: 14,
    color: '#4A5568',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  medicationPair: {
    flex: 1,
    gap: 2,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  vsText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  severityBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  severityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  severityValue: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  evidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  recommendationSection: {
    backgroundColor: '#F7FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 0,
  },
  recommendationText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2B6CB0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#2B6CB0',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
