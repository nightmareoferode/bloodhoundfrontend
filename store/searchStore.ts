import * as SecureStore from 'expo-secure-store';

const SEARCHES_KEY = 'recent_searches';
const MAX_SEARCHES = 20;

export async function saveSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = await getRecentSearches();
  const deduped = [trimmed, ...current.filter(s => s !== trimmed)].slice(0, MAX_SEARCHES);
  await SecureStore.setItemAsync(SEARCHES_KEY, JSON.stringify(deduped));
}

export async function getRecentSearches(): Promise<string[]> {
  const json = await SecureStore.getItemAsync(SEARCHES_KEY);
  if (!json) return [];
  return JSON.parse(json) as string[];
}

export async function clearRecentSearches(): Promise<void> {
  await SecureStore.deleteItemAsync(SEARCHES_KEY);
}
