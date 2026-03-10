import React, { useState, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, Linking, ScrollView,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, DrawerActions } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth, useIsAdmin } from '../context/AuthContext'
import { ECOSYSTEM_AGENTS } from '../lib/agents'
import { loadConversations, saveConversations, clearAllConversations } from '../lib/storage'
import { Conversation, RootStackParamList } from '../types'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainDrawer'>

export default function DrawerContent() {
  const navigation = useNavigation<NavProp>()
  const { user, logout } = useAuth()
  const isAdmin = useIsAdmin(user?.email)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [search, setSearch] = useState('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'starred'>('all')
  const [activeTab, setActiveTab] = useState<'nav' | 'history'>('nav')

  const loadHistory = useCallback(async () => {
    const convs = await loadConversations()
    setConversations(convs.filter(c => c.messages.filter(m => !m.isLoading).length > 0))
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const filteredHistory = conversations
    .filter(c => {
      if (historyFilter === 'starred' && !c.starred) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return c.title.toLowerCase().includes(q)
        || c.agentName.toLowerCase().includes(q)
    })
    .slice(0, 40)

  const toggleStar = useCallback(async (convId: string) => {
    const updated = conversations.map(c =>
      c.id === convId ? { ...c, starred: !c.starred } : c
    )
    setConversations(updated.filter(c => c.messages.filter(m => !m.isLoading).length > 0))
    await saveConversations(updated)
  }, [conversations])

  const deleteConv = useCallback((convId: string) => {
    Alert.alert('Apagar conversa', 'Tem certeza que deseja apagar esta conversa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const updated = conversations.filter(c => c.id !== convId)
          setConversations(updated)
          await saveConversations(updated)
        },
      },
    ])
  }, [conversations])

  const clearAll = useCallback(() => {
    Alert.alert('Limpar histórico', 'Apagar TODAS as conversas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar tudo',
        style: 'destructive',
        onPress: async () => {
          await clearAllConversations()
          setConversations([])
        },
      },
    ])
  }, [])

  const handleLogout = useCallback(() => {
    Alert.alert('Sair', 'Deseja realmente sair do BEN Ecosystem IA?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => logout(),
      },
    ])
  }, [logout])

  const openConversation = useCallback((conv: Conversation) => {
    navigation.dispatch(DrawerActions.closeDrawer())
    navigation.navigate('Chat', { agentId: conv.agentId, conversationId: conv.id })
  }, [navigation])

  const EXTERNAL_LINKS = [
    { url: 'https://bengrowth.mauromoncao.adv.br', label: 'Growth Center', icon: 'trending-up', color: '#059669' },
    { url: 'https://juris.mauromoncao.adv.br',    label: 'Juris Center',  icon: 'scale-balance', color: '#1d4ed8' },
    { url: 'https://hub.mauromoncao.adv.br',       label: 'HUB Estratégico', icon: 'view-dashboard', color: '#7c3aed' },
  ]

  return (
    <View style={styles.container}>
      {/* ── CABEÇALHO DO DRAWER ─────────────────────────────── */}
      <View style={styles.drawerHeader}>
        <View style={styles.drawerLogo}>
          <Text style={styles.drawerLogoText}>⚖️</Text>
        </View>
        <View style={styles.drawerHeaderInfo}>
          <Text style={styles.drawerBrand}>BEN ECOSYSTEM IA</Text>
          <Text style={styles.drawerUser} numberOfLines={1}>{user?.nome || 'Usuário'}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.closeDrawer())} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={22} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* ── TABS: MENU / HISTÓRICO ─────────────────────────── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'nav' && styles.tabActive]}
          onPress={() => setActiveTab('nav')}
        >
          <MaterialCommunityIcons name="menu" size={16} color={activeTab === 'nav' ? '#0f2044' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'nav' && styles.tabTextActive]}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => { setActiveTab('history'); loadHistory() }}
        >
          <MaterialCommunityIcons name="history" size={16} color={activeTab === 'history' ? '#0f2044' : '#9ca3af'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            Histórico ({conversations.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── CONTEÚDO ─────────────────────────────────────────── */}
      {activeTab === 'nav' ? (
        <ScrollView style={styles.navContent} showsVerticalScrollIndicator={false}>
          {/* Workspace */}
          <View style={styles.navSection}>
            <Text style={styles.sectionLabel}>WORKSPACE</Text>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                navigation.dispatch(DrawerActions.closeDrawer())
                navigation.navigate('MainDrawer')
              }}
            >
              <View style={[styles.navItemIcon, { backgroundColor: '#1d4ed820' }]}>
                <MaterialCommunityIcons name="view-dashboard" size={18} color="#1d4ed8" />
              </View>
              <Text style={styles.navItemText}>Dashboard</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                navigation.dispatch(DrawerActions.closeDrawer())
                navigation.navigate('MainDrawer')
              }}
            >
              <View style={[styles.navItemIcon, { backgroundColor: '#D4A01720' }]}>
                <MaterialCommunityIcons name="robot-outline" size={18} color="#D4A017" />
              </View>
              <Text style={styles.navItemText}>Todos os Agentes</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          {/* Links externos */}
          <View style={styles.navSection}>
            <Text style={styles.sectionLabel}>ECOSSISTEMA</Text>
            {EXTERNAL_LINKS.map(({ url, label, icon, color }) => (
              <TouchableOpacity
                key={url}
                style={styles.navItem}
                onPress={() => Linking.openURL(url)}
              >
                <View style={[styles.navItemIcon, { backgroundColor: color + '20' }]}>
                  <MaterialCommunityIcons name={icon as any} size={18} color={color} />
                </View>
                <Text style={styles.navItemText}>{label}</Text>
                <MaterialCommunityIcons name="open-in-new" size={14} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Perfil */}
          <View style={styles.navSection}>
            <Text style={styles.sectionLabel}>CONTA</Text>
            <View style={styles.profileCard}>
              <View style={[styles.profileAvatar, isAdmin && styles.profileAvatarAdmin]}>
                <Text style={styles.profileAvatarText}>
                  {(user?.nome || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.nome}</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
                <Text style={styles.profileSub}>Sessão ativa · 8h</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={18} color="#dc2626" />
              <Text style={styles.logoutText}>Sair do sistema</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.historyContent}>
          {/* Busca e filtros */}
          <View style={styles.historySearch}>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar conversa…"
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.historyFilters}>
              <TouchableOpacity
                style={[styles.filterChip, historyFilter === 'all' && styles.filterChipActive]}
                onPress={() => setHistoryFilter('all')}
              >
                <Text style={[styles.filterText, historyFilter === 'all' && styles.filterTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, historyFilter === 'starred' && styles.filterChipStarred]}
                onPress={() => setHistoryFilter(v => v === 'starred' ? 'all' : 'starred')}
              >
                <MaterialCommunityIcons name="star" size={12} color={historyFilter === 'starred' ? '#d97706' : '#9ca3af'} />
                <Text style={[styles.filterText, historyFilter === 'starred' && styles.filterTextStarred]}>
                  Favoritos
                </Text>
              </TouchableOpacity>
              {conversations.length > 0 && (
                <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                  <Text style={styles.clearText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Lista */}
          {filteredHistory.length === 0 ? (
            <View style={styles.historyEmpty}>
              <MaterialCommunityIcons name="history" size={40} color="#e5e7eb" />
              <Text style={styles.historyEmptyText}>
                {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma conversa salva ainda.'}
              </Text>
              <Text style={styles.historyEmptySub}>
                Inicie uma conversa com um agente para ver o histórico aqui
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredHistory}
              keyExtractor={item => item.id}
              renderItem={({ item }) => {
                const agent = ECOSYSTEM_AGENTS.find(a => a.id === item.agentId)
                const msgCount = item.messages.filter(m => !m.isLoading).length
                return (
                  <TouchableOpacity
                    style={styles.historyItem}
                    onPress={() => openConversation(item)}
                  >
                    <View style={[styles.historyEmoji, { backgroundColor: (agent?.color || '#888') + '18' }]}>
                      <Text style={styles.historyEmojiText}>{item.agentEmoji}</Text>
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.historyMeta} numberOfLines={1}>
                        {item.agentName} · {new Date(item.updatedAt).toLocaleDateString('pt-BR')} · {msgCount} msgs
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity onPress={() => toggleStar(item.id)} style={styles.historyAction}>
                        <MaterialCommunityIcons
                          name={item.starred ? 'star' : 'star-outline'}
                          size={16}
                          color={item.starred ? '#d97706' : '#d1d5db'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteConv(item.id)} style={styles.historyAction}>
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#fca5a5" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                )
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      )}

      {/* ── RODAPÉ ────────────────────────────────────────────── */}
      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>
          © 2026 Mauro Monção Advogados · falcone
        </Text>
        <Text style={styles.footerSub}>BEN Ecosystem IA v1.0 Mobile</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerHeader: {
    backgroundColor: '#0f2044',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  drawerLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(212,160,23,0.2)',
    borderWidth: 1.5,
    borderColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerLogoText: { fontSize: 22 },
  drawerHeaderInfo: { flex: 1 },
  drawerBrand: { fontSize: 13, fontWeight: '800', color: '#D4A017', letterSpacing: 0.5 },
  drawerUser: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  adminBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D4A017',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 3,
  },
  adminBadgeText: { fontSize: 8, fontWeight: '900', color: '#0f2044' },
  closeBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#0f2044',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9ca3af' },
  tabTextActive: { color: '#0f2044' },
  navContent: { flex: 1 },
  navSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 1,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  navItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 8,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#0f2044',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarAdmin: { backgroundColor: '#D4A017' },
  profileAvatarText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: '700', color: '#0f2044' },
  profileEmail: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  profileSub: { fontSize: 10, color: '#9ca3af', marginTop: 1 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#dc2626' },
  // History
  historyContent: { flex: 1 },
  historySearch: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#111827' },
  historyFilters: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#0f2044', borderColor: '#0f2044' },
  filterChipStarred: { backgroundColor: '#fef3c7', borderColor: '#fbbf24' },
  filterText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#ffffff' },
  filterTextStarred: { color: '#d97706' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' as any },
  clearText: { fontSize: 11, color: '#ef4444' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  historyEmoji: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  historyEmojiText: { fontSize: 18 },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  historyMeta: { fontSize: 10, color: '#6b7280', marginTop: 1 },
  historyActions: { flexDirection: 'row', gap: 4 },
  historyAction: { padding: 6 },
  historyEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  historyEmptyText: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 12, textAlign: 'center' },
  historyEmptySub: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'center',
  },
  footerText: { fontSize: 11, color: '#9ca3af' },
  footerSub: { fontSize: 10, color: '#d1d5db', marginTop: 2 },
})
