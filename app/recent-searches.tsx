import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { clearRecentSearches, getRecentSearches } from '../store/searchStore';

export default function RecentSearchesScreen() {
  const router = useRouter();
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    getRecentSearches().then(setSearches);
  }, []);

  async function handleClear() {
    await clearRecentSearches();
    setSearches([]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Recent Searches</Text>
          {searches.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {searches.length === 0 ? (
          <Text style={styles.empty}>No recent searches yet.</Text>
        ) : (
          <FlatList
            data={searches}
            keyExtractor={(item, index) => `${item}-${index}`}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push('/search')}
              >
                <Text style={styles.itemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
  },
  clearText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '600',
  },
  empty: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 48,
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemText: {
    fontSize: 15,
    color: '#1A202C',
  },
  separator: {
    height: 10,
  },
});
