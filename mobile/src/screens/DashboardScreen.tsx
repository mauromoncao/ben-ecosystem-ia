import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, StatusBar, Dimensions, Alert,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useNavigation, DrawerActions } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'
import { RootStackParamList } from '../types'
import { API_BASE_URL } from '../lib/agents'

const { width } = Dimensions.get('window')
type NavProp = NativeStackNavigationProp<RootStackParamList, 'MainDrawer'>

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Stats {
  processos: number
  clientes: number
  prazos: number
  djen_pendentes: number
}

interface Prazo {
  id: string
  numero_cnj?: string
  descricao: string
  data_prazo: string
  tipo: string
  prioridade: 'urgente' | 'alta' | 'normal'
  cliente?: string
}

interface Processo {
  id: string
  numero_cnj: string
  titulo: string
  cliente: string
  status: string
  area: string
  ultimo_movimento?: string
}

interface QuickAction {
  icon: string
  label: string
  color: string
  agentId: string
  prompt: string
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS: QuickAction[] = [
  { icon: 'scale-balance', label: 'Petição',    color: '#1d4ed8', agentId: 'ben-peticionista-juridico',  prompt: 'Preciso elaborar uma petição.' },
  { icon: 'clock-alert',   label: 'Prazos',     color: '#dc2626', agentId: 'ben-auditor-processual',     prompt: 'Quais processos têm prazos para essa semana?' },
  { icon: 'magnify',       label: 'Pesquisar',  color: '#7c3aed', agentId: 'ben-pesquisador-juridico',   prompt: 'Pesquise jurisprudência sobre:' },
  { icon: 'file-document', label: 'Contrato',   color: '#059669', agentId: 'ben-contratualista',         prompt: 'Preciso elaborar um contrato.' },
  { icon: 'chart-line',    label: 'Relatório',  color: '#d97706', agentId: 'ben-relator-juridico',       prompt: 'Elabore um relatório sobre:' },
  { icon: 'shield-check',  label: 'Compliance', color: '#0f766e', agentId: 'ben-especialista-compliance', prompt: 'Analise a conformidade de:' },
]

// ── Dados mock offline (exibidos quando VPS não responde) ─────────────────────
const MOCK_STATS: Stats = { processos: 47, clientes: 12, prazos: 8, djen_pendentes: 3 }

const MOCK_PRAZOS: Prazo[] = [
  { id: '1', descricao: 'Recurso de Apelação — Proc. 0001234', data_prazo: new Date(Date.now() + 2 * 86400000).toISOString(), tipo: 'recurso', prioridade: 'urgente', cliente: 'Prefeitura Teresina' },
  { id: '2', descricao: 'Impugnação de Laudo Pericial', data_prazo: new Date(Date.now() + 5 * 86400000).toISOString(), tipo: 'manifestacao', prioridade: 'alta', cliente: 'Secretaria Saúde PI' },
  { id: '3', descricao: 'Contrarrazões — MS Tributário', data_prazo: new Date(Date.now() + 7 * 86400000).toISOString(), tipo: 'recurso', prioridade: 'normal', cliente: 'TechSol Ltda' },
  { id: '4', descricao: 'Audiência de Instrução — Trabalhista', data_prazo: new Date(Date.now() + 10 * 86400000).toISOString(), tipo: 'audiencia', prioridade: 'alta', cliente: 'Câmara Municipal' },
]

const MOCK_PROCESSOS: Processo[] = [
  { id: '1', numero_cnj: '0001234-55.2024.8.18.0001', titulo: 'Ação de Improbidade Administrativa', cliente: 'Prefeitura Teresina', status: 'ativo', area: 'Administrativo', ultimo_movimento: '08/03/2026' },
  { id: '2', numero_cnj: '0007891-22.2023.4.01.4100', titulo: 'Mandado de Segurança Tributário', cliente: 'TechSol Ltda', status: 'ativo', area: 'Tributário', ultimo_movimento: '01/03/2026' },
  { id: '3', numero_cnj: '0002345-01.2022.5.22.0001', titulo: 'Reclamação Trabalhista Coletiva', cliente: 'Câmara Municipal', status: 'suspenso', area: 'Trabalhista', ultimo_movimento: '15/02/2026' },
]

// ── Utils ──────────────────────────────────────────────────────────────────────
function diasRestantes(dataISO: string): number {
  const agora = Date.now()
  const prazo = new Date(dataISO).getTime()
  return Math.ceil((prazo - agora) / 86400000)
}

function fmtDias(dias: number): string {
  if (dias < 0) return 'Vencido'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Amanhã'
  return `${dias} dias`
}

function prioridadeStyle(p: Prazo['prioridade']): { bg: string; text: string; dot: string } {
  const m = {
    urgente: { bg: '#FEE2E2', text: '#991B1B', dot: '#ef4444' },
    alta:    { bg: '#FEF3C7', text: '#92400E', dot: '#f59e0b' },
    normal:  { bg: '#F0FDF4', text: '#065F46', dot: '#22c55e' },
  }
  return m[p]
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
export default function DashboardScreen() {
  const navigation = useNavigation<NavProp>()
  const { user }   = useAuth()

  const [stats, setStats]       = useState<Stats | null>(null)
  const [prazos, setPrazos]     = useState<Prazo[]>([])
  const [processos, setProcessos] = useState<Processo[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [vpsOnline, setVpsOnline]   = useState(false)
  const [hora, setHora]         = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bridge?action=status`, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const d = await res.json()
        const vpsStatus = d.modulos?.vps?.status
        setVpsOnline(vpsStatus === 'online')

        if (vpsStatus === 'online' && d.stats) {
          setStats(d.stats)
        } else {
          setStats(MOCK_STATS)
        }
      } else {
        setStats(MOCK_STATS)
        setVpsOnline(false)
      }
    } catch {
      setStats(MOCK_STATS)
      setVpsOnline(false)
    }

    // Try to load prazos from VPS
    try {
      const res = await fetch(`${API_BASE_URL}/api/bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prazos_proximos', dias: 15 }),
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const d = await res.json()
        if (d.data && Array.isArray(d.data)) {
          setPrazos(d.data.slice(0, 6))
          setLoading(false)
          return
        }
      }
    } catch { /* use mock */ }

    setPrazos(MOCK_PRAZOS)
    setProcessos(MOCK_PROCESSOS)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => {
      setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }, 60000)
    return () => clearInterval(interval)
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const openAgentWithPrompt = useCallback((agentId: string, prompt: string) => {
    navigation.navigate('Chat', { agentId })
  }, [navigation])

  const greet = (): string => {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f2044" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuBtn}>
          <MaterialCommunityIcons name="menu" size={24} color="#D4A017" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerGreet}>{greet()}, Dr. Mauro</Text>
          <Text style={styles.headerSub}>{hora} · BEN Ecosystem</Text>
        </View>
        <View style={[styles.vpsIndicator, { backgroundColor: vpsOnline ? '#22c55e22' : '#ef444422' }]}>
          <View style={[styles.vpsDot, { backgroundColor: vpsOnline ? '#22c55e' : '#ef4444' }]} />
          <Text style={[styles.vpsText, { color: vpsOnline ? '#22c55e' : '#ef4444' }]}>
            VPS
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4A017" />}
      >
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {[
            { icon: 'scale-balance', label: 'Processos', value: stats?.processos ?? '—', color: '#1d4ed8', bg: '#EFF6FF' },
            { icon: 'account-group', label: 'Clientes',  value: stats?.clientes ?? '—',  color: '#059669', bg: '#F0FDF4' },
            { icon: 'clock-alert',   label: 'Prazos',    value: stats?.prazos ?? '—',    color: '#dc2626', bg: '#FEF2F2' },
            { icon: 'bell-ring',     label: 'DJEN',      value: stats?.djen_pendentes ?? '—', color: '#7c3aed', bg: '#F5F3FF' },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
              <MaterialCommunityIcons name={k.icon as any} size={22} color={k.color} />
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Ações rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickCard}
                activeOpacity={0.75}
                onPress={() => openAgentWithPrompt(a.agentId, a.prompt)}
              >
                <View style={[styles.quickIcon, { backgroundColor: a.color + '18' }]}>
                  <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prazos críticos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏰ Prazos Próximos</Text>
            <TouchableOpacity onPress={() => openAgentWithPrompt('ben-auditor-processual', 'Mostre todos os prazos dos próximos 15 dias')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {(prazos.length > 0 ? prazos : MOCK_PRAZOS).map(p => {
            const dias = diasRestantes(p.data_prazo)
            const st = prioridadeStyle(p.prioridade)
            return (
              <View key={p.id} style={[styles.prazoCard, { borderLeftColor: st.dot }]}>
                <View style={styles.prazoLeft}>
                  <View style={[styles.prazoDot, { backgroundColor: st.dot }]} />
                  <View style={styles.prazoInfo}>
                    <Text style={styles.prazoDesc} numberOfLines={2}>{p.descricao}</Text>
                    {p.cliente && <Text style={styles.prazoCliente}>{p.cliente}</Text>}
                  </View>
                </View>
                <View style={[styles.prazoBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.prazoDias, { color: st.text }]}>{fmtDias(dias)}</Text>
                </View>
              </View>
            )
          })}
        </View>

        {/* Processos recentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚖️ Processos Recentes</Text>
            <TouchableOpacity onPress={() => openAgentWithPrompt('ben-analista-processual', 'Liste os processos mais recentes')}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {(processos.length > 0 ? processos : MOCK_PROCESSOS).map(p => (
            <TouchableOpacity
              key={p.id}
              style={styles.processoCard}
              activeOpacity={0.75}
              onPress={() => openAgentWithPrompt('ben-analista-processual', `Analise o processo ${p.numero_cnj} — ${p.titulo}`)}
            >
              <View style={styles.processoHeader}>
                <Text style={styles.processoCNJ} numberOfLines={1}>{p.numero_cnj}</Text>
                <View style={[styles.statusBadge,
                  p.status === 'ativo' ? styles.statusAtivo : p.status === 'suspenso' ? styles.statusSuspenso : styles.statusEncerrado
                ]}>
                  <Text style={[styles.statusText,
                    p.status === 'ativo' ? styles.statusAtivoText : p.status === 'suspenso' ? styles.statusSuspensoText : styles.statusEncerradoText
                  ]}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.processoTitulo} numberOfLines={1}>{p.titulo}</Text>
              <View style={styles.processoMeta}>
                <Text style={styles.processoCliente}>{p.cliente}</Text>
                <View style={styles.areaTag}>
                  <Text style={styles.areaTagText}>{p.area}</Text>
                </View>
              </View>
              {p.ultimo_movimento && (
                <Text style={styles.processoMov}>Últ. movimento: {p.ultimo_movimento}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>BEN Ecosystem IA · Mauro Monção Advogados</Text>
          <Text style={styles.footerSub}>
            {vpsOnline ? '🟢 VPS online' : '🔴 Modo offline (dados demo)'} · {hora}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4F8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: '#0f2044',
    gap: 12,
  },
  menuBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerGreet: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.2 },
  headerSub: { fontSize: 12, color: '#6b7aaa', marginTop: 1 },
  vpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  vpsDot: { width: 7, height: 7, borderRadius: 4 },
  vpsText: { fontSize: 11, fontWeight: '700' },

  scroll: { flex: 1 },

  kpiGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 4,
  },
  kpiValue: { fontSize: 22, fontWeight: '800' },
  kpiLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#0f2044' },
  sectionLink: { fontSize: 12, color: '#1d4ed8', fontWeight: '600' },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: (width - 52) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },

  prazoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  prazoLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginRight: 10 },
  prazoDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  prazoInfo: { flex: 1 },
  prazoDesc: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', lineHeight: 18 },
  prazoCliente: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  prazoBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, flexShrink: 0 },
  prazoDias: { fontSize: 11, fontWeight: '700' },

  processoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  processoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  processoCNJ: { fontSize: 11, fontFamily: 'monospace', color: '#0f2044', fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusAtivo: { backgroundColor: '#D1FAE5' },
  statusSuspenso: { backgroundColor: '#FEF3C7' },
  statusEncerrado: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 10, fontWeight: '700' },
  statusAtivoText: { color: '#065F46' },
  statusSuspensoText: { color: '#92400E' },
  statusEncerradoText: { color: '#6B7280' },
  processoTitulo: { fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  processoMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  processoCliente: { fontSize: 11, color: '#6B7280', flex: 1 },
  areaTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  areaTagText: { fontSize: 10, color: '#1d4ed8', fontWeight: '600' },
  processoMov: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },

  footer: { padding: 24, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  footerSub: { fontSize: 10, color: '#C4C9D4' },
})
