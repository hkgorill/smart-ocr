import AsyncStorage from '@react-native-async-storage/async-storage'
import { HistoryItem, OCRResult } from '../types/ocr'

const STORAGE_KEY = 'ocr_history'
const MAX_ITEMS = 50

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HistoryItem[]) : []
  } catch {
    return []
  }
}

export async function saveHistoryItem(imageUri: string, result: OCRResult): Promise<HistoryItem> {
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageUri,
    result,
    createdAt: new Date().toISOString(),
  }
  const history = await loadHistory()
  const updated = [item, ...history].slice(0, MAX_ITEMS)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return item
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const history = await loadHistory()
  const updated = history.filter((item) => item.id !== id)
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY)
}
