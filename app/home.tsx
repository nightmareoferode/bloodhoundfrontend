import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Search } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.layout}>

        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.logo}>BH</Text>
          <View style={styles.sidebarIcons}>
            <TouchableOpacity style={styles.userIconButton} onPress={() => router.push('/user-profile')}>
              <User size={22} color="#2B6CB0" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchIconButton} onPress={() => router.push('/search')}>
              <Search size={20} color="#2B6CB0" strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/medication-profile')}>
              <Text style={styles.icon}>edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          <Text style={styles.welcomeHeading}>Welcome</Text>
          <Text style={styles.nameHeading}>Name</Text>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/drug-checker')}>
              <Text style={styles.buttonText}>Quick Reference</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/meds-list')}>
              <Text style={styles.buttonText}>List of Existing Meds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/recent-searches')}>
              <Text style={styles.buttonText}>Recent Searches</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },

  // Sidebar
  sidebar: {
    width: 72,
    backgroundColor: '#1A365D',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 40,
  },
  sidebarIcons: {
    flex: 1,
    gap: 32,
  },
  icon: {
    color: '#BEE3F8',
    fontSize: 12,
    textAlign: 'center',
  },
  userIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#CBD5E0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 1,
  },

  // Main
  main: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  welcomeHeading: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A202C',
  },
  nameHeading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2B6CB0',
    marginBottom: 48,
  },
  buttonGroup: {
    gap: 16,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
});
