import { useFocusEffect, useRouter } from 'expo-router';
import { Menu, Pencil, Search, User, X } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { getMedicationProfile } from '../store/medicationStore';

const SIDEBAR_WIDTH = 220;
const ICON_COLOR = '#4285F4';

export default function HomeScreen() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [logoMenuVisible, setLogoMenuVisible] = useState(false);
  const [logoMenuSelection, setLogoMenuSelection] = useState<'switch' | 'logout' | null>(null);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useFocusEffect(
    useCallback(() => {
      getMedicationProfile().then((profile) => {
        if (profile?.name) setUserName(profile.name);
      });
    }, [])
  );

  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(slideAnim, {
      toValue: -SIDEBAR_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSidebarOpen(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main dashboard */}
      <View style={styles.main}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
            <Menu size={22} color={ICON_COLOR} strokeWidth={2} strokeLinecap="round" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBadge} onPress={() => router.push('/help')}>
            <Text style={styles.helpGlyph}>?</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome content */}
        <View style={styles.content}>
          <Text style={styles.welcomeHeading}>Welcome</Text>
          <Text style={styles.nameHeading}>{userName || 'Name'}</Text>

          <View style={styles.cardGroup}>
            <TouchableOpacity style={styles.card} onPress={() => router.push('/drug-checker')}>
              <Text style={styles.cardText}>Quick Reference</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => router.push('/meds-list')}>
              <Text style={styles.cardText}>List of Existing Meds</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => router.push('/recent-searches')}>
              <Text style={styles.cardText}>Recent Searches</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Overlay — closes sidebar on tap outside */}
      {sidebarOpen && (
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Animated sidebar */}
      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* Sidebar header: BH logo + close button */}
        <View style={styles.sidebarHeader}>
          <TouchableOpacity onPress={() => setLogoMenuVisible(true)}>
            <Image source={require('../assets/images/img.jpeg')} style={styles.logo} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={closeSidebar}>
            <X size={20} color={ICON_COLOR} strokeWidth={2} strokeLinecap="round" />
          </TouchableOpacity>
        </View>

        <View style={styles.navList}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { closeSidebar(); router.push('/user-profile'); }}
          >
            <View style={styles.navIconWrap}>
              <User size={20} color={ICON_COLOR} strokeWidth={2} strokeLinecap="round" />
            </View>
            <Text style={styles.navLabel}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { closeSidebar(); router.push('/search'); }}
          >
            <View style={styles.navIconWrap}>
              <Search size={20} color={ICON_COLOR} strokeWidth={2} strokeLinecap="round" />
            </View>
            <Text style={styles.navLabel}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => { closeSidebar(); router.push('/medication-profile'); }}
          >
            <View style={styles.navIconWrap}>
              <Pencil size={20} color={ICON_COLOR} strokeWidth={2} strokeLinecap="round" />
            </View>
            <Text style={styles.navLabel}>Edit</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Logo menu modal */}
      <Modal
        transparent
        visible={logoMenuVisible}
        animationType="fade"
        onRequestClose={() => setLogoMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setLogoMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.logoMenu}>
                <Text style={styles.logoMenuTitle}>Account</Text>

                <TouchableOpacity
                  style={[
                    styles.logoMenuOption,
                    logoMenuSelection === 'switch' && styles.logoMenuOptionSelected,
                  ]}
                  onPress={() => setLogoMenuSelection('switch')}
                >
                  <Text
                    style={[
                      styles.logoMenuOptionText,
                      logoMenuSelection === 'switch' && styles.logoMenuOptionTextSelected,
                    ]}
                  >
                    Switch User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.logoMenuOption,
                    logoMenuSelection === 'logout' && styles.logoMenuOptionSelected,
                  ]}
                  onPress={() => setLogoMenuSelection('logout')}
                >
                  <Text
                    style={[
                      styles.logoMenuOptionText,
                      logoMenuSelection === 'logout' && styles.logoMenuOptionTextSelected,
                    ]}
                  >
                    Log Out
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.logoMenuConfirm,
                    !logoMenuSelection && styles.logoMenuConfirmDisabled,
                  ]}
                  disabled={!logoMenuSelection}
                  onPress={() => {
                    setLogoMenuVisible(false);
                    setLogoMenuSelection(null);
                    closeSidebar();
                    if (logoMenuSelection === 'switch') {
                      router.replace('/');
                    } else if (logoMenuSelection === 'logout') {
                      router.replace('/');
                    }
                  }}
                >
                  <Text style={styles.logoMenuConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Main dashboard
  main: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 8,
  },
  helpBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpGlyph: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4285F4',
    lineHeight: 26,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
  },
  welcomeHeading: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A202C',
  },
  nameHeading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4285F4',
    marginBottom: 40,
  },
  cardGroup: {
    gap: 16,
  },
  card: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Sidebar
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingTop: 52,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F8FA',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navList: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
  },

  // Logo menu modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMenu: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  logoMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
  },
  logoMenuOption: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#CBD5E0',
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
  },
  logoMenuOptionSelected: {
    borderColor: '#4285F4',
    backgroundColor: '#EBF2FF',
  },
  logoMenuOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A202C',
  },
  logoMenuOptionTextSelected: {
    color: '#4285F4',
  },
  logoMenuConfirm: {
    marginTop: 4,
    width: '100%',
    paddingVertical: 13,
    borderRadius: 50,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  logoMenuConfirmDisabled: {
    backgroundColor: '#CBD5E0',
  },
  logoMenuConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
