import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const SECTIONS = [
  {
    title: 'Quick Reference',
    body: 'To use Quick Reference, just type in the names of two medicines. The tool quickly checks for any dangerous interactions and shows you a risk level. It also gives simple tips on how to handle side effects and helps you contact your doctor immediately if the situation looks serious.',
  },
  {
    title: 'List of Existing Meds',
    body: 'The Existing Meds list displays all medications you are currently taking. Use this section to track active prescriptions, review dosages, and monitor your schedule. Keeping this list updated ensures BloodHound can accurately check for potential complications with any new medications.',
  },
  {
    title: 'Recent Searches',
    body: 'The Recent Searches tab stores your history for quick access. Revisit previously searched medications to review their specific details and interaction reports without having to re-enter the information again.',
  },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Help</Text>
        <Text style={styles.pageSubtitle}>How to use BloodHound</Text>

        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.dot} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>For further queries:</Text>
          <Text style={styles.footerContact}>Contact Javinator</Text>
          <Text style={styles.footerPhone}>9836826235</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A202C',
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4285F4',
    marginBottom: 36,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A202C',
  },
  divider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
  },
  footer: {
    marginTop: 8,
  },
  footerDivider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 10,
  },
  footerContact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 2,
  },
  footerPhone: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '500',
  },
});
