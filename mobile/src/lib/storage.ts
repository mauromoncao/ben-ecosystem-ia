import AsyncStorage from '@react-native-async-storage/async-storage'
import { Conversation, Message } from '../types'

export const STORAGE_KEY   = 'ben_ecosystem_conversations'
export const SESSION_KEY   = 'ben_ecosystem_session'
export const MAX_STORED    = 50
export const SESSION_DURATION = 8 * 60 * 60 * 1000

// ─── Conversas ───────────────────────────────────────────────────────────────
export async function loadConversations(): Promise<Conversation[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export async function saveConversations(convs: Conversation[]): Promise<void> {
  try {
    const clean = convs.slice(0, MAX_STORED).map(c => ({
      ...c,
      messages: c.messages.filter((m: Message) => !m.isLoading),
    }))
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch {
    // quota
  }
}

export async function clearAllConversations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ─── Sessão ───────────────────────────────────────────────────────────────────
export async function refreshSession(): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(Date.now() + SESSION_DURATION))
  } catch { /* ignore */ }
}

export async function isSessionValid(): Promise<boolean> {
  try {
    const exp = await AsyncStorage.getItem(SESSION_KEY)
    if (!exp) return false
    const parsed = JSON.parse(exp)
    return parsed !== null && Date.now() < parsed
  } catch {
    return false
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY)
  } catch { /* ignore */ }
}
