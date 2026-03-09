import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ScrollView, RefreshControl, Animated,
  Dimensions, StatusBar,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, DrawerActions } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth, useIsAdmin } from '../context/AuthContext'
import { ECOSYSTEM_AGENTS, RESTRICTED_AGENTS } from '../lib/agents'
import { checkSystemStatus } from '../lib/api'
import { Agent, EcosystemStatus, RootStackParamList } from '../types'
import { loadConversations } from '../lib/storage'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48 - 12) / 2  // 2 colunas com padding

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainDrawer'>

const CATEGORY_LABELS: Record<string, string> = {
  marketing: '📣 Marketing',
  juridico: '⚖️ Jurídico',
  sistema: '🔧 Sistema',
  contador: '🧮 Contabilidade',
  perito: '🔬 Peritos',
  atendimento: '🤝 Atendimento',
}

const MODEL_BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  gpt:    { bg: '#dbeafe', text: '#1d4ed8' },
  claude: { bg: '#fed7aa', text: '#c2410c' },
  sonnet: { bg: '#fef08a', text: '#854d0e' },
  opus:   { bg: '#fde68a', text: '#92400e' },
  perp:   { bg: '#e0e7ff', text: '#4338ca' },
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    online: '#22c55e',
    offline: '#ef4444',
    degraded: '#facc15',
    checking: '#9ca3af',
  }
  return (
    <View style={[styles.statusDot, { backgroundColor: colors[status] || '#9ca3af' }]} />
  )
}

function AgentCard({
  agent,
  selected,
  status,
  restricted,
  failCount,
  onPress,
}: {
  agent: Agent
  selected: boolean
  status: string
  restricted: boolean
  failCount: number
  onPress: () => void
}) {
  const badgeColors = MODEL_BADGE_COLORS[agent.modelBadge] || { bg: '#f3f4f6', text: '#374151' }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={restricted}
      activeOpacity={0.75}
      style={[
        styles.agentCard,
        selected && { borderColor: agent.color, borderWidth: 2, backgroundColor: agent.color + '0a' },
        restricted && styles.agentCardRestricted,
      ]}
    >
      {/* Emoji + status dot */}
      <View style={styles.agentCardHeader}>
        <View style={[styles.agentEmoji, { backgroundColor: agent.color + '20', borderColor: agent.color + '40' }]}>
          <Text style={styles.agentEmojiText}>{agent.emoji}</Text>
        </View>
        <View style={[styles.statusDotWrapper]}>
          <StatusDot status={status} />
        </View>
      </View>

      {/* Nome */}
      <Text style={styles.agentName} numberOfLines={2}>{agent.name}</Text>

      {/* Descrição */}
      <Text style={styles.agentDesc} numberOfLines={2}>{agent.description}</Text>

      {/* Badges */}
      <View style={styles.agentBadges}>
        <View style={[styles.badge, { backgroundColor: agent.project === 'growth' ? '#dcfce7' : '#dbeafe' }]}>
          <Text style={[styles.badgeText, { color: agent.project === 'growth' ? '#15803d' : '#1d4ed8' }]}>
            {agent.project === 'growth' ? 'Growth' : 'Juris'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
          <Text style={[styles.badgeText, { color: badgeColors.text }]} numberOfLines={1}>
            {agent.model.length > 12 ? agent.model.slice(0, 12) + '…' : agent.model}
          </Text>
        </View>
        {restricted && (
          <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
            <Text style={[styles.badgeText, { color: '#dc2626' }]}>🔒 Admin</Text>
          </View>
        )}
        {failCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#ffedd5' }]}>
            <Text style={[styles.badgeText, { color: '#c2410c' }]}>⚠️ {failCount}x</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

export default function WorkspaceScreen() {
  const navigation = useNavigation<NavProp>()
  const { user } = useAuth()
  const isAdmin = useIsAdmin(user?.email)

  const [ecoStatus, setEcoStatus]         = useState<EcosystemStatus>({ growth: 'checking', juris: 'checking', vps: 'checking' })
  const [filterProject, setFilterProject] = useState<'all' | 'growth' | 'juris'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [search, setSearch]               = useState('')
  const [refreshing, setRefreshing]       = useState(false)
  const [retryCount, setRetryCount]       = useState<Record<string, number>>({})
  const [convCount, setConvCount]         = useState(0)

  const visibleAgents = ECOSYSTEM_AGENTS.filter(a =>
    isAdmin ? true : !RESTRICTED_AGENTS.includes(a.id)
  )

  const filteredAgents = visibleAgents.filter(a => {
    if (filterProject !== 'all' && a.project !== filterProject) return false
    if (filterCategory !== 'all' && a.category !== filterCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    }
    return true
  })

  const categories = ['all', ...Array.from(new Set(visibleAgents.map(a => a.category)))]

  const checkStatus = useCallback(async () => {
    setEcoStatus(prev => ({ ...prev, growth: 'checking', juris: 'checking', vps: 'checking' }))
    const s = await checkSystemStatus()
    setEcoStatus({ growth: s.growth as any, juris: s.juris as any, vps: s.vps as any, lastCheck: new Date().toLocaleTimeString('pt-BR') })
  }, [])

  useEffect(() => {
    checkStatus()
    loadConversations().then(convs => setConvCount(convs.filter(c => c.messages.filter(m => !m.isLoading).length > 0).length))
  }, [checkStatus])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await checkStatus()
    const convs = await loadConversations()
    setConvCount(convs.filter(c => c.messages.filter(m => !m.isLoading).length > 0).length)
    setRefreshing(false)
  }, [checkStatus])

  const agentStatus = (agent: Agent): string => {
    if (agent.project === 'growth') return ecoStatus.growth
    if (agent.project === 'juris') return ecoStatus.juris
    return 'online'
  }

  const openChat = useCallback((agent: Agent) => {
    if (!isAdmin && RESTRICTED_AGENTS.includes(agent.id)) return
    navigation.navigate('Chat', { agentId: agent.id })
  }, [navigation, isAdmin])

  const renderAgent = useCallback(({ item, index }: { item: Agent; index: number }) => (
    <AgentCard
      key={item.id}
      agent={item}
      selected={false}
      status={agentStatus(item)}
      restricted={!isAdmin && RESTRICTED_AGENTS.includes(item.id)}
      failCount={retryCount[item.id] || 0}
      onPress={() => openChat(item)}
    />
  ), [agentStatus, isAdmin, retryCount, openChat])

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2044" />

      {/* ── HEADER ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>BEN ECOSYSTEM IA</Text>
          <Text style={styles.headerSub}>{visibleAgents.length} agentes ativos</Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.historyButton}
        >
          <MaterialCommunityIcons name="history" size={22} color="#D4A017" />
          {convCount > 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{convCount > 9 ? '9+' : convCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── STATUS DOS SISTEMAS ─────────────────────────────── */}
      <View style={styles.statusBar}>
        <TouchableOpacity style={styles.statusItem} onPress={checkStatus}>
          <StatusDot status={ecoStatus.growth} />
          <Text style={styles.statusLabel}>Growth</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusItem} onPress={checkStatus}>
          <StatusDot status={ecoStatus.juris} />
          <Text style={styles.statusLabel}>Juris</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statusItem} onPress={checkStatus}>
          <StatusDot status={ecoStatus.vps} />
          <Text style={styles.statusLabel}>VPS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={checkStatus} style={styles.refreshBtn}>
          <MaterialCommunityIcons name="refresh" size={14} color="#6b7280" />
        </TouchableOpacity>
        {ecoStatus.lastCheck && (
          <Text style={styles.lastCheck}>{ecoStatus.lastCheck}</Text>
        )}
      </View>

      {/* ── BUSCA ──────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar agente…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── FILTROS PROJETO ────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'growth', 'juris'] as const).map(p => (
          <TouchableOpacity
            key={p}
            onPress={() => { setFilterProject(p); setFilterCategory('all') }}
            style={[
              styles.filterChip,
              filterProject === p && styles.filterChipActive,
              filterProject === p && {
                backgroundColor: p === 'growth' ? '#059669' : p === 'juris' ? '#1d4ed8' : '#0f2044'
              }
            ]}
          >
            <Text style={[styles.filterChipText, filterProject === p && styles.filterChipTextActive]}>
              {p === 'all' ? `Todos (${visibleAgents.length})` :
               p === 'growth' ? `Growth (${visibleAgents.filter(a => a.project === 'growth').length})` :
               `Juris (${visibleAgents.filter(a => a.project === 'juris').length})`}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {categories.filter(c => c !== 'all').map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setFilterCategory(cat)}
            style={[styles.filterChip, filterCategory === cat && styles.filterChipCat]}
          >
            <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
              {CATEGORY_LABELS[cat] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── LISTA DE AGENTES ───────────────────────────────── */}
      <FlatList
        data={filteredAgents}
        renderItem={renderAgent}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.agentsList}
        columnWrapperStyle={styles.agentsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Nenhum agente encontrado</Text>
            <Text style={styles.emptySubText}>Tente ajustar os filtros</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 20 }} />}
      />

      {/* ── LEGENDA DE STATUS ──────────────────────────────── */}
      <View style={styles.legend}>
        {[
          { status: 'online', label: 'Online', color: '#22c55e' },
          { status: 'offline', label: 'Offline', color: '#ef4444' },
          { status: 'degraded', label: 'Degradado', color: '#facc15' },
          { status: 'checking', label: 'Verificando', color: '#9ca3af' },
        ].map(({ status, label, color }) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#0f2044',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  menuButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D4A017',
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: 11,
    color: '#6b7aaa',
    marginTop: 1,
  },
  historyButton: {
    padding: 4,
    marginLeft: 8,
    position: 'relative',
  },
  historyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#D4A017',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  historyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f2044',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f2044',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotWrapper: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 1,
  },
  statusLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  refreshBtn: {
    padding: 2,
  },
  lastCheck: {
    fontSize: 9,
    color: '#475569',
    marginLeft: 'auto' as any,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterRow: {
    maxHeight: 44,
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    borderColor: 'transparent',
  },
  filterChipCat: {
    backgroundColor: '#0f2044',
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  agentsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  agentsRow: {
    gap: 12,
    justifyContent: 'space-between',
  },
  agentCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  agentCardRestricted: {
    opacity: 0.4,
  },
  agentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agentEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  agentEmojiText: {
    fontSize: 22,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 16,
    marginBottom: 4,
  },
  agentDesc: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 14,
    marginBottom: 8,
  },
  agentBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: '#9ca3af',
  },
})
