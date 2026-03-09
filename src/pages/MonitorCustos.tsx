import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Clock, DollarSign,
  Download, Eye, EyeOff, Filter, Layers, Lock, Loader2,
  RefreshCw, Shield, TrendingUp, Zap, XCircle
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────
interface LogEntry {
  id: string
  agentId: string
  modelUsed: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  elapsed_ms: number
  timestamp: string
  source: string
}

interface AgentStat {
  agentId: string
  calls: number
  costUsd: number
  costBrl: number
  inputTokens: number
  outputTokens: number
}

interface ModelStat {
  modelId: string
  label: string
  cor: string
  calls: number
  costUsd: number
  costBrl: number
  inputTokens: number
  outputTokens: number
}

interface DailyStat {
  date: string
  costUsd: number
  calls: number
}

interface MonitorData {
  summary: {
    totalCalls: number
    totalCostUsd: number
    totalCostBrl: number
    dailyCostUsd: number
    dailyCostBrl: number
    monthlyCostUsd: number
    monthlyCostBrl: number
    totalInputTokens: number
    totalOutputTokens: number
    usdBrlRate: number
    alertas: { level: string; msg: string }[]
    limites: { dailyUsd: number; monthlyUsd: number }
  }
  byAgent: AgentStat[]
  byModel: ModelStat[]
  daily: DailyStat[]
  recentLogs: LogEntry[]
}

// ── Configuração ──────────────────────────────────────────
const MONITOR_URL = '/api/monitor'
const REFRESH_INTERVAL = 30_000 // 30 s

// ── Utilitários ───────────────────────────────────────────
function fmt(n: number, dec = 6) { return n.toFixed(dec) }
function fmtBrl(n: number)       { return `R$ ${n.toFixed(4)}` }
function fmtUsd(n: number)       { return `$ ${n.toFixed(6)}` }
function fmtK(n: number)         { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }
function fmtMs(ms: number)       { return ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${ms}ms` }

function modelColor(modelId: string): string {
  const colors: Record<string, string> = {
    'claude-haiku-4-5':       '#4ADE80', 'claude-haiku-fallback':  '#86EFAC',
    'claude-sonnet-4-5':      '#60A5FA', 'claude-sonnet-fallback': '#93C5FD',
    'claude-opus-4-5':        '#F472B6',
    'gpt-4o':                 '#FBBF24', 'gpt-4o-fallback':       '#FCD34D',
    'gpt-4o-mini':            '#A3E635', 'gpt-4o-mini-final':     '#BEF264',
    'perplexity':             '#C084FC',
  }
  return colors[modelId] || '#94A3B8'
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function MonitorCustos() {
  const [locked, setLocked]       = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [token, setToken]         = useState('')

  const [data, setData]           = useState<MonitorData | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'agents'|'models'|'logs'|'trends'>('overview')
  const [showUsd, setShowUsd]     = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Fetch dados do monitor ──────────────────────────────
  const fetchData = useCallback(async (tok: string) => {
    if (!tok) return
    setLoading(true)
    setError('')
    try {
      const r = await fetch(`${MONITOR_URL}?action=stats&token=${encodeURIComponent(tok)}`)
      if (r.status === 401) {
        setError('Token inválido ou expirado.')
        setLocked(true)
        setToken('')
        return
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setData(d)
      setLastUpdate(new Date())
      setLocked(false)   // ← só desbloqueia APÓS confirmar token válido
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados')
      // Não bloqueia em erro de rede (token pode ser válido, API fora do ar)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Login ───────────────────────────────────────────────
  const handleLogin = async () => {
    if (!tokenInput.trim()) { setTokenError('Informe o token de acesso.'); return }
    setTokenError('')
    setLoading(true)
    const tok = tokenInput.trim()
    try {
      // Valida token ANTES de desbloquear
      const r = await fetch(`${MONITOR_URL}?action=stats&token=${encodeURIComponent(tok)}`)
      if (r.status === 401) {
        setTokenError('Token inválido. Verifique e tente novamente.')
        setLoading(false)
        return
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setToken(tok)
      setData(d)
      setLastUpdate(new Date())
      setLocked(false)   // ← desbloqueia somente após 200 OK
    } catch (e: unknown) {
      // Em erro de rede, libera mesmo assim (token pode ser correto)
      setToken(tok)
      setLocked(false)
      setError('Não foi possível carregar dados. Verifique a conexão.')
    } finally {
      setLoading(false)
    }
  }

  // ── Auto-refresh ────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh || locked || !token) return
    timerRef.current = setInterval(() => fetchData(token), REFRESH_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, locked, token, fetchData])

  // ── Export CSV ──────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['agentId','modelUsed','calls','inputTokens','outputTokens','costUsd','costBrl'],
      ...data.byAgent.map(a => [a.agentId, '', a.calls, a.inputTokens, a.outputTokens, a.costUsd, a.costBrl]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `ben-monitor-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ══════════════════════════════════════════════════════
  // TELA DE LOGIN (bloqueada)
  // ══════════════════════════════════════════════════════
  if (locked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 border border-red-900/40 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-red-900/30 border border-red-700/50 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Monitor de Custos</h1>
              <p className="text-sm text-gray-400 mt-1">BEN Ecosystem IA — Acesso Administrativo</p>
              <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-800/40 rounded-full">
                <Lock className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-300 font-medium">RESTRITO — Dr. Mauro Monção</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token de Acesso Admin</label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/30"
                />
                {tokenError && <p className="text-red-400 text-xs mt-1">{tokenError}</p>}
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-red-700 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando token…</>
                  : <><Shield className="w-4 h-4" /> Acessar Monitor</>
                }
              </button>
            </div>

            <p className="text-center text-xs text-gray-600 mt-6">
              Este painel não aparece no menu principal.<br/>Acesse via <code className="text-gray-400">/monitor-admin</code>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // PAINEL PRINCIPAL
  // ══════════════════════════════════════════════════════
  const s = data?.summary
  const maxDailyCost = Math.max(...(data?.daily.map(d => d.costUsd) || [0.001]), 0.001)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Top Bar ── */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-900/30 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">Monitor de Custos de Tokens</h1>
            <p className="text-xs text-gray-400">BEN Ecosystem IA — Painel Administrativo Privado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => setShowUsd(v => !v)}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-gray-800"
          >
            {showUsd ? <EyeOff className="w-3 h-3"/> : <Eye className="w-3 h-3"/>}
            {showUsd ? 'BRL' : 'USD'}
          </button>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${autoRefresh ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh && !loading ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Pausado'}
          </button>
          <button
            onClick={() => fetchData(token)}
            disabled={loading}
            className="text-xs bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button onClick={exportCSV} className="text-xs bg-gray-800 text-gray-300 hover:text-white px-2 py-1 rounded flex items-center gap-1">
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={() => { setLocked(true); setToken(''); setData(null) }}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-900/20"
          >
            <Lock className="w-3 h-3 inline mr-1" />Sair
          </button>
        </div>
      </div>

      {/* ── Alertas ── */}
      {s?.alertas && s.alertas.length > 0 && (
        <div className="px-6 pt-4 space-y-2">
          {s.alertas.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm ${a.level === 'critical' ? 'bg-red-950/60 border-red-700/50 text-red-300' : 'bg-yellow-950/60 border-yellow-700/50 text-yellow-300'}`}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {a.msg}
            </div>
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-red-950/60 border-red-700/50 text-red-300 text-sm">
            <XCircle className="w-4 h-4" />{error}
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Zap,         label: 'Chamadas Totais',   value: fmtK(s?.totalCalls || 0),                             sub: 'todas execuções',             color: 'blue'   },
            { icon: DollarSign,  label: 'Custo Hoje',        value: showUsd ? fmtUsd(s?.dailyCostUsd || 0) : fmtBrl(s?.dailyCostBrl || 0),   sub: `limite $${s?.limites.dailyUsd}`,   color: s && s.dailyCostUsd >= (s.limites.dailyUsd * 0.8) ? 'red' : 'green' },
            { icon: TrendingUp,  label: 'Custo Mensal',      value: showUsd ? `$ ${fmt(s?.monthlyCostUsd || 0, 4)}` : fmtBrl(s?.monthlyCostBrl || 0), sub: `limite $${s?.limites.monthlyUsd}`,  color: s && s.monthlyCostUsd >= (s.limites.monthlyUsd * 0.8) ? 'yellow' : 'indigo' },
            { icon: Layers,      label: 'Tokens Totais',     value: fmtK((s?.totalInputTokens || 0) + (s?.totalOutputTokens || 0)), sub: `in:${fmtK(s?.totalInputTokens||0)} out:${fmtK(s?.totalOutputTokens||0)}`, color: 'purple' },
          ].map((kpi, i) => {
            const colorMap: Record<string, string> = {
              blue: 'from-blue-900/30 border-blue-700/30 text-blue-400',
              green: 'from-green-900/30 border-green-700/30 text-green-400',
              red: 'from-red-900/30 border-red-700/30 text-red-400',
              yellow: 'from-yellow-900/30 border-yellow-700/30 text-yellow-400',
              indigo: 'from-indigo-900/30 border-indigo-700/30 text-indigo-400',
              purple: 'from-purple-900/30 border-purple-700/30 text-purple-400',
            }
            const cls = colorMap[kpi.color] || colorMap.blue
            return (
              <div key={i} className={`bg-gradient-to-br ${cls} border rounded-xl p-4`}>
                <kpi.icon className={`w-5 h-5 mb-2 ${cls.split(' ')[2]}`} />
                <div className={`text-2xl font-bold ${cls.split(' ')[2]}`}>{kpi.value}</div>
                <div className="text-xs text-gray-400 mt-1">{kpi.label}</div>
                <div className="text-xs text-gray-600">{kpi.sub}</div>
              </div>
            )
          })}
        </div>

        {/* ── Taxa de câmbio ── */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <DollarSign className="w-3 h-3" />
          Câmbio configurado: 1 USD = R$ {s?.usdBrlRate || 5.75}
          <span className="text-gray-700 ml-2">•</span>
          <span>Custo total USD: {fmtUsd(s?.totalCostUsd || 0)}</span>
          <span className="text-gray-700">•</span>
          <span>Custo total BRL: {fmtBrl(s?.totalCostBrl || 0)}</span>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 w-fit">
          {(['overview','agents','models','logs','trends'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'overview' ? 'Visão Geral' : tab === 'agents' ? 'Por Agente' : tab === 'models' ? 'Por Modelo' : tab === 'logs' ? 'Logs' : 'Tendências'}
            </button>
          ))}
        </div>

        {/* ── Conteúdo das Tabs ── */}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Top 5 agentes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" /> Top Agentes por Custo
              </h3>
              <div className="space-y-2">
                {(data?.byAgent.slice(0, 8) || []).map((a, i) => {
                  const maxCost = data?.byAgent[0]?.costUsd || 0.001
                  const pct = ((a.costUsd / maxCost) * 100).toFixed(0)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-4">{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-300 truncate">{a.agentId.replace('ben-', '')}</span>
                          <span className="text-xs text-gray-400 ml-2">{a.calls}x · {showUsd ? fmtUsd(a.costUsd) : fmtBrl(a.costBrl)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(!data?.byAgent.length) && <p className="text-xs text-gray-600 text-center py-4">Nenhum dado ainda. Execute agentes para ver estatísticas.</p>}
              </div>
            </div>

            {/* Top 5 modelos */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-400" /> Custo por Modelo
              </h3>
              <div className="space-y-2">
                {(data?.byModel || []).map((m, i) => {
                  const maxCost = data?.byModel[0]?.costUsd || 0.001
                  const pct = ((m.costUsd / maxCost) * 100).toFixed(0)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.cor || modelColor(m.modelId) }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-300">{m.label || m.modelId}</span>
                          <span className="text-xs text-gray-400">{m.calls}x · {showUsd ? fmtUsd(m.costUsd) : fmtBrl(m.costBrl)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.cor || modelColor(m.modelId) }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
                {(!data?.byModel.length) && <p className="text-xs text-gray-600 text-center py-4">Nenhum dado ainda.</p>}
              </div>
            </div>

            {/* Logs recentes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-400" /> Execuções Recentes
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(data?.recentLogs || []).map((log, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-800/50 last:border-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: modelColor(log.modelUsed) }} />
                    <span className="text-xs text-gray-400 w-32 truncate">{log.agentId.replace('ben-', '')}</span>
                    <span className="text-xs text-gray-500 w-28 truncate">{log.modelUsed}</span>
                    <span className="text-xs text-gray-400 w-16 text-right">{fmtK(log.inputTokens + log.outputTokens)} tok</span>
                    <span className="text-xs text-yellow-400 w-20 text-right">{showUsd ? `$${fmt(log.costUsd, 6)}` : fmtBrl(log.costUsd * 5.75)}</span>
                    <span className="text-xs text-gray-600 w-16 text-right">{fmtMs(log.elapsed_ms)}</span>
                    <span className="text-xs text-gray-700 flex-1 text-right">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                  </div>
                ))}
                {(!data?.recentLogs?.length) && <p className="text-xs text-gray-600 text-center py-4">Nenhuma execução registrada ainda.</p>}
              </div>
            </div>
          </div>
        )}

        {/* AGENTS */}
        {activeTab === 'agents' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  {['Agente','Chamadas','Tokens Entrada','Tokens Saída','Custo USD','Custo BRL'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.byAgent || []).map((a, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2 text-gray-300 font-mono">{a.agentId}</td>
                    <td className="px-4 py-2 text-blue-400">{a.calls}</td>
                    <td className="px-4 py-2 text-green-400">{fmtK(a.inputTokens)}</td>
                    <td className="px-4 py-2 text-purple-400">{fmtK(a.outputTokens)}</td>
                    <td className="px-4 py-2 text-yellow-400">{fmtUsd(a.costUsd)}</td>
                    <td className="px-4 py-2 text-orange-400">{fmtBrl(a.costBrl)}</td>
                  </tr>
                ))}
                {(!data?.byAgent.length) && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">Nenhum dado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* MODELS */}
        {activeTab === 'models' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/50">
                  {['Modelo','Chamadas','Tokens Entrada','Tokens Saída','Custo USD','Custo BRL','% do Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.byModel || []).map((m, i) => {
                  const totalCost = data?.summary.totalCostUsd || 0.001
                  const pct = ((m.costUsd / totalCost) * 100).toFixed(1)
                  return (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: m.cor || '#94A3B8' }} />
                          <span className="text-gray-300">{m.label || m.modelId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-blue-400">{m.calls}</td>
                      <td className="px-4 py-2 text-green-400">{fmtK(m.inputTokens)}</td>
                      <td className="px-4 py-2 text-purple-400">{fmtK(m.outputTokens)}</td>
                      <td className="px-4 py-2 text-yellow-400">{fmtUsd(m.costUsd)}</td>
                      <td className="px-4 py-2 text-orange-400">{fmtBrl(m.costBrl)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: m.cor || '#94A3B8' }} />
                          </div>
                          <span className="text-gray-500 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!data?.byModel.length) && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">Nenhum dado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">Últimas {data?.recentLogs?.length || 0} execuções (max 500 em memória)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-800/50">
                    {['Timestamp','Agente','Modelo','Tokens In','Tokens Out','Custo USD','Custo BRL','Tempo','Fonte'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-gray-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentLogs || []).map((log, i) => (
                    <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/20 transition-colors">
                      <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="px-3 py-1.5 text-gray-300 max-w-32 truncate">{log.agentId}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: modelColor(log.modelUsed) }} />
                          <span className="text-gray-400">{log.modelUsed}</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 text-green-400">{fmtK(log.inputTokens)}</td>
                      <td className="px-3 py-1.5 text-purple-400">{fmtK(log.outputTokens)}</td>
                      <td className="px-3 py-1.5 text-yellow-400">{fmtUsd(log.costUsd)}</td>
                      <td className="px-3 py-1.5 text-orange-400">{fmtBrl(log.costUsd * 5.75)}</td>
                      <td className="px-3 py-1.5 text-gray-500">{fmtMs(log.elapsed_ms)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{log.source}</td>
                    </tr>
                  ))}
                  {(!data?.recentLogs?.length) && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-600">Nenhum log disponível.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRENDS */}
        {activeTab === 'trends' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> Custo Diário (últimos 30 dias)
            </h3>
            {data?.daily.length ? (
              <div className="space-y-2">
                {data.daily.map((d, i) => {
                  const pct = ((d.costUsd / maxDailyCost) * 100).toFixed(0)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-24">{d.date}</span>
                      <div className="flex-1 h-5 bg-gray-800 rounded overflow-hidden relative">
                        <div
                          className="h-full rounded transition-all"
                          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-xs text-white/70">{fmtUsd(d.costUsd)}</span>
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{d.calls}x</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nenhum dado de tendência disponível.</p>
                <p className="text-xs mt-1">Execute agentes para acumular dados de custo.</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-800 pt-4 flex items-center justify-between text-xs text-gray-700">
          <span>BEN Monitor v1.0 · Admin privado · Sem acesso público</span>
          <span>Atualização automática a cada {REFRESH_INTERVAL/1000}s</span>
        </div>
      </div>
    </div>
  )
}
