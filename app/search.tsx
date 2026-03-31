import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { saveSearch } from '../store/searchStore';

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  async function handleSubmit() {
    await saveSearch(query);
    setQuery('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.heading}>Search</Text>
        <TextInput
          style={styles.input}
          placeholder="Search for a drug or medication..."
          placeholderTextColor="#A0AEC0"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoFocus
        />
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
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A202C',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});
