import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Activity, AlertTriangle, BarChart3, Clock, DollarSign,
  Download, Eye, EyeOff, Filter, Layers, Lock, Loader2,
  RefreshCw, Shield, TrendingUp, Zap, XCircle, LogOut,
  CheckCircle, ChevronDown, FileText, User
} from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────
interface LogEntry {
  id: string; agentId: string; modelUsed: string
  inputTokens: number; outputTokens: number
  costUsd: number; elapsed_ms: number
  timestamp: string; source: string
}
interface AgentStat {
  agentId: string; calls: number
  costUsd: number; costBrl: number
  inputTokens: number; outputTokens: number
}
interface ModelStat {
  modelId: string; label: string; cor: string; calls: number
  costUsd: number; costBrl: number
  inputTokens: number; outputTokens: number
}
interface DailyStat { date: string; costUsd: number; calls: number }
interface MonitorData {
  summary: {
    totalCalls: number; totalCostUsd: number; totalCostBrl: number
    dailyCostUsd: number; dailyCostBrl: number
    monthlyCostUsd: number; monthlyCostBrl: number
    totalInputTokens: number; totalOutputTokens: number
    usdBrlRate: number
    alertas: { level: string; msg: string }[]
    limites: { dailyUsd: number; monthlyUsd: number }
  }
  byAgent: AgentStat[]; byModel: ModelStat[]
  daily: DailyStat[]; recentLogs: LogEntry[]
}

// ── Config ──────────────────────────────────────────────────
const MONITOR_URL      = '/api/monitor'
const REFRESH_INTERVAL = 30_000

// ── Formatadores ────────────────────────────────────────────
const fmtBrl  = (n: number) => `R$ ${n.toFixed(4)}`
const fmtUsd  = (n: number) => `$ ${n.toFixed(6)}`
const fmtK    = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)
const fmtMs   = (ms: number) => ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${ms}ms`
const fmtPct  = (v: number, max: number) => max > 0 ? Math.min(100, (v/max)*100) : 0

function modelColor(id: string): string {
  const map: Record<string,string> = {
    'claude-haiku-4-5':'#4ADE80','claude-sonnet-4-5':'#60A5FA',
    'claude-opus-4-5':'#F472B6','gpt-4o':'#FBBF24',
    'gpt-4o-mini':'#A3E635','perplexity':'#C084FC',
  }
  return map[id] || '#94A3B8'
}

// ── Agentes — emoji helper ────────────────────────────────
const AGENT_EMOJI: Record<string,string> = {
  'ben-conteudista':'✍️','ben-estrategista-campanhas':'📊',
  'ben-analista-relatorios':'📈','ben-analista-monitoramento':'🔍',
  'ben-estrategista-marketing':'📣','ben-diretor-criativo':'🎨',
  'ben-revisor-juridico':'📝','ben-peticionista':'🔱',
  'ben-super-agente-juridico':'🌟','ben-peticionista-juridico':'🔱',
  'ben-contratualista':'📋','ben-mandatario-juridico':'📜',
  'ben-analista-processual':'🔬','ben-auditor-processual':'🔏',
  'ben-gestor-juridico':'🏢','ben-tributarista':'💰',
  'ben-trabalhista':'👷','ben-previdenciarista':'🔱',
  'ben-pesquisador-juridico':'🔎','ben-especialista-compliance':'🛡️',
  'ben-relator-juridico':'📚','ben-redator-juridico':'✒️',
  'ben-constitucionalista':'⚡','ben-engenheiro-prompt':'🧠',
  'ben-contador-tributarista':'🧮','ben-perito-forense':'🔬',
}

// ════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════
export default function MonitorCustos() {
  const [locked,      setLocked]      = useState(true)
  const [tokenInput,  setTokenInput]  = useState('')
  const [tokenError,  setTokenError]  = useState('')
  const [token,       setToken]       = useState('')
  const [showPwd,     setShowPwd]     = useState(false)

  const [data,        setData]        = useState<MonitorData | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab,   setActiveTab]   = useState<'overview'|'agents'|'models'|'logs'|'trends'>('overview')
  const [showBrl,     setShowBrl]     = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── fetchData ───────────────────────────────────────────
  const fetchData = useCallback(async (tok: string) => {
    if (!tok) return
    setLoading(true); setError('')
    try {
      const r = await fetch(`${MONITOR_URL}?action=stats&token=${encodeURIComponent(tok)}`)
      if (r.status === 401) { setError('Token inválido.'); setLocked(true); setToken(''); return }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setData(d); setLastUpdate(new Date()); setLocked(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally { setLoading(false) }
  }, [])

  // ── handleLogin (async — valida antes de desbloquear) ───
  const handleLogin = async () => {
    if (!tokenInput.trim()) { setTokenError('Informe o token de acesso.'); return }
    setTokenError(''); setLoading(true)
    const tok = tokenInput.trim()
    try {
      const r = await fetch(`${MONITOR_URL}?action=stats&token=${encodeURIComponent(tok)}`)
      if (r.status === 401) { setTokenError('Token inválido. Verifique e tente novamente.'); return }
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const d = await r.json()
      setToken(tok); setData(d); setLastUpdate(new Date()); setLocked(false)
    } catch (e: unknown) {
      setToken(tok); setLocked(false)
      setError('Não foi possível carregar dados. Verifique a conexão.')
    } finally { setLoading(false) }
  }

  // ── auto-refresh ────────────────────────────────────────
  useEffect(() => {
    if (!autoRefresh || locked || !token) return
    timerRef.current = setInterval(() => fetchData(token), REFRESH_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [autoRefresh, locked, token, fetchData])

  // ── exportCSV ───────────────────────────────────────────
  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['agentId','calls','inputTokens','outputTokens','costUsd','costBrl'],
      ...data.byAgent.map(a => [a.agentId,'',a.calls,a.inputTokens,a.outputTokens,a.costUsd.toFixed(6),a.costBrl.toFixed(4)]),
    ]
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'})
    const url  = URL.createObjectURL(blob); const a = document.createElement('a')
    a.href=url; a.download=`ben-monitor-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ════════════════════════════════════════════════════════
  // TELA DE LOGIN — padrão BEN Ecosystem
  // ════════════════════════════════════════════════════════
  if (locked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center"
        style={{background:'linear-gradient(135deg,#0a1628 0%,#0f2044 55%,#1a3060 100%)'}}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <img src="/falcone-logo.png" alt="Falcone"
              className="w-16 h-16 rounded-2xl object-cover shadow-2xl"
              onError={e => { e.currentTarget.style.display='none' }}
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2"
              style={{background:'#7f1d1d', borderColor:'#0f2044'}}>
              <Shield className="w-3 h-3 text-red-400"/>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BEN ECOSYSTEM IA</h1>
          <p className="text-sm mt-0.5" style={{color:'#D4A017'}}>Monitor de Custos & Tokens</p>
          <p className="text-xs text-gray-400 mt-1">Mauro Monção Advogados Associados</p>
        </div>

        {/* Card de login */}
        <div className="w-full max-w-sm rounded-2xl shadow-2xl p-8"
          style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(212,160,23,0.2)', backdropFilter:'blur(16px)'}}>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background:'rgba(220,38,38,0.2)', border:'1px solid rgba(220,38,38,0.4)'}}>
              <Lock className="w-4 h-4 text-red-400"/>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Acesso Administrativo</p>
              <p className="text-xs" style={{color:'#D4A017'}}>RESTRITO — Dr. Mauro Monção</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{color:'#D4A017'}}>
                Token de Acesso Admin
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500"/>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background:'rgba(255,255,255,0.08)',
                    border:'1px solid rgba(255,255,255,0.15)',
                    color:'#ffffff'
                  }}
                  onFocus={e => (e.target.style.borderColor='#D4A017')}
                  onBlur={e  => (e.target.style.borderColor='rgba(255,255,255,0.15)')}
                />
                <button type="button" onClick={() => setShowPwd(v=>!v)}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
              {tokenError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3"/> {tokenError}
                </p>
              )}
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{background: loading ? '#b8860b' : 'linear-gradient(135deg,#D4A017,#b8860b)', color:'#0f2044'}}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin"/> Verificando token…</>
                : <><Shield className="w-4 h-4"/> Acessar Monitor</>
              }
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-900/20 border border-red-800/30">
              <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0"/>
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <p className="text-center text-xs mt-5" style={{color:'#9ca3af'}}>
            Painel privado · não listado no menu principal
          </p>
        </div>

        <p className="text-xs mt-5" style={{color:'#6b7280'}}>
          © 2026 Mauro Monção Advogados Associados · BEN Ecosystem IA
        </p>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // PAINEL PRINCIPAL — padrão BEN Ecosystem
  // ════════════════════════════════════════════════════════
  const s = data?.summary
  const maxDailyCost = Math.max(...(data?.daily.map(d => d.costUsd) || [0.001]), 0.001)

  const kpis = [
    {
      icon: Zap, label: 'Chamadas Totais', sub: 'todas execuções',
      value: fmtK(s?.totalCalls || 0),
      color: '#0f2044', bg: 'rgba(15,32,68,0.06)', border: 'rgba(15,32,68,0.15)',
    },
    {
      icon: DollarSign, label: 'Custo Hoje',
      sub: `limite $${s?.limites?.dailyUsd || 10}`,
      value: showBrl ? fmtBrl(s?.dailyCostBrl || 0) : fmtUsd(s?.dailyCostUsd || 0),
      color: s && s.dailyCostUsd >= (s.limites?.dailyUsd || 10) * 0.8 ? '#dc2626' : '#059669',
      bg:    s && s.dailyCostUsd >= (s.limites?.dailyUsd || 10) * 0.8 ? 'rgba(220,38,38,0.06)' : 'rgba(5,150,105,0.06)',
      border:s && s.dailyCostUsd >= (s.limites?.dailyUsd || 10) * 0.8 ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)',
    },
    {
      icon: TrendingUp, label: 'Custo Mensal',
      sub: `limite $${s?.limites?.monthlyUsd || 200}`,
      value: showBrl ? fmtBrl(s?.monthlyCostBrl || 0) : `$ ${(s?.monthlyCostUsd || 0).toFixed(2)}`,
      color: s && s.monthlyCostUsd >= (s.limites?.monthlyUsd || 200) * 0.8 ? '#d97706' : '#7c3aed',
      bg:    s && s.monthlyCostUsd >= (s.limites?.monthlyUsd || 200) * 0.8 ? 'rgba(217,119,6,0.06)' : 'rgba(124,58,237,0.06)',
      border:s && s.monthlyCostUsd >= (s.limites?.monthlyUsd || 200) * 0.8 ? 'rgba(217,119,6,0.2)' : 'rgba(124,58,237,0.2)',
    },
    {
      icon: Layers, label: 'Tokens Totais',
      sub: `in: ${fmtK(s?.totalInputTokens||0)} · out: ${fmtK(s?.totalOutputTokens||0)}`,
      value: fmtK((s?.totalInputTokens||0)+(s?.totalOutputTokens||0)),
      color: '#1d4ed8', bg: 'rgba(29,78,216,0.06)', border: 'rgba(29,78,216,0.2)',
    },
  ]

  return (
    <div className="min-h-screen" style={{background:'#f5f6fa'}}>

      {/* ── HEADER ────────────────────────────────────────── */}
      <div className="sticky top-0 z-40" style={{background:'#0f2044', borderBottom:'1px solid #1a3060', boxShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">

          {/* Logo + título */}
          <div className="flex items-center gap-2.5">
            <img src="/falcone-logo.png" alt="Falcone"
              className="w-8 h-8 rounded-lg object-cover"
              onError={e => { e.currentTarget.style.display='none' }}
            />
            <div>
              <p className="text-xs font-bold leading-none" style={{color:'#D4A017'}}>BEN ECOSYSTEM</p>
              <p className="text-xs leading-none mt-0.5" style={{color:'#6b7aaa'}}>Monitor de Tokens</p>
            </div>
          </div>

          <div className="h-5 w-px mx-1" style={{background:'#1a3060'}}/>

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-xs" style={{color:'#6b7aaa'}}>Admin</span>
          </div>

          {lastUpdate && (
            <span className="text-xs ml-1" style={{color:'#4a5580'}}>
              Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}

          {/* Alertas badge */}
          {s?.alertas && s.alertas.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-900/30 border border-red-700/30">
              <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse"/>
              <span className="text-xs text-red-300 font-medium">{s.alertas.length} alerta(s)</span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1"/>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowBrl(v=>!v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{background:'rgba(255,255,255,0.07)', color:'#D4A017', border:'1px solid rgba(212,160,23,0.2)'}}>
              {showBrl ? 'BRL' : 'USD'}
            </button>
            <button onClick={() => setAutoRefresh(v=>!v)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${autoRefresh ? 'text-green-300' : 'text-gray-400'}`}
              style={{background: autoRefresh ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${autoRefresh ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)'}`}}>
              <RefreshCw className={`w-3 h-3 ${autoRefresh && !loading ? 'animate-spin' : ''}`}/>
              {autoRefresh ? 'Auto' : 'Pausado'}
            </button>
            <button onClick={() => fetchData(token)} disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
              style={{background:'rgba(212,160,23,0.15)', color:'#D4A017', border:'1px solid rgba(212,160,23,0.25)'}}>
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}/>
              Atualizar
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{background:'rgba(255,255,255,0.06)', color:'#6b7aaa', border:'1px solid rgba(255,255,255,0.08)'}}>
              <Download className="w-3 h-3"/> CSV
            </button>
            <button
              onClick={() => { setLocked(true); setToken(''); setData(null) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{background:'rgba(220,38,38,0.15)', color:'#f87171', border:'1px solid rgba(220,38,38,0.2)'}}>
              <LogOut className="w-3 h-3"/> Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── Alertas ────────────────────────────────────── */}
        {s?.alertas && s.alertas.length > 0 && (
          <div className="space-y-2">
            {s.alertas.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
                a.level === 'critical'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-700'
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0"/>
                {a.msg}
              </div>
            ))}
          </div>
        )}

        {/* ── Erro ────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0"/> {error}
          </div>
        )}

        {/* ── KPI Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="rounded-2xl p-5 border shadow-sm"
              style={{background:'#ffffff', borderColor: kpi.border}}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{background: kpi.bg}}>
                  <kpi.icon className="w-4 h-4" style={{color: kpi.color}}/>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{background: kpi.bg, color: kpi.color}}>
                  {kpi.sub}
                </span>
              </div>
              <p className="text-2xl font-bold" style={{color: kpi.color}}>{kpi.value}</p>
              <p className="text-xs mt-1" style={{color:'#888'}}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Câmbio ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs"
          style={{background:'#ffffff', border:'1px solid #e5e7eb', color:'#888'}}>
          <DollarSign className="w-3.5 h-3.5" style={{color:'#D4A017'}}/>
          <span>1 USD = R$ {s?.usdBrlRate || 5.75}</span>
          <span style={{color:'#e5e7eb'}}>|</span>
          <span>Custo total: <strong style={{color:'#0f2044'}}>{fmtUsd(s?.totalCostUsd||0)}</strong></span>
          <span style={{color:'#e5e7eb'}}>|</span>
          <span>BRL: <strong style={{color:'#0f2044'}}>{fmtBrl(s?.totalCostBrl||0)}</strong></span>
        </div>

        {/* ── Tabs ────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl" style={{background:'#f0f2f5', border:'1px solid #e5e7eb', width:'fit-content'}}>
          {([
            {key:'overview', label:'Visão Geral', icon:BarChart3},
            {key:'agents',   label:'Por Agente',  icon:User},
            {key:'models',   label:'Por Modelo',  icon:Layers},
            {key:'logs',     label:'Logs',         icon:Clock},
            {key:'trends',   label:'Tendências',   icon:TrendingUp},
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={activeTab === tab.key
                ? {background:'#0f2044', color:'#D4A017'}
                : {color:'#888', background:'transparent'}}>
              <tab.icon className="w-3.5 h-3.5"/>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ───────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top agentes */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{color:'#0f2044'}}>
                <BarChart3 className="w-4 h-4" style={{color:'#D4A017'}}/> Top Agentes por Custo
              </h3>
              <div className="space-y-3">
                {(data?.byAgent.slice(0, 8) || []).map((a, i) => {
                  const maxCost = data?.byAgent[0]?.costUsd || 0.001
                  const pct = fmtPct(a.costUsd, maxCost)
                  const emoji = AGENT_EMOJI[a.agentId] || '🤖'
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] text-gray-400 w-4">{i+1}</span>
                      <span className="text-sm">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate" style={{color:'#222'}}>
                            {a.agentId.replace('ben-','').replace(/-/g,' ')}
                          </span>
                          <span className="text-xs ml-2 flex-shrink-0" style={{color:'#888'}}>
                            {a.calls}x · {showBrl ? fmtBrl(a.costBrl) : fmtUsd(a.costUsd)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#f0f2f5'}}>
                          <div className="h-full rounded-full transition-all"
                            style={{width:`${pct}%`, background:'linear-gradient(90deg,#0f2044,#D4A017)'}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!data?.byAgent.length && (
                  <p className="text-xs text-center py-6" style={{color:'#ccc'}}>
                    Nenhum dado. Execute agentes para ver estatísticas.
                  </p>
                )}
              </div>
            </div>

            {/* Por modelo */}
            <div className="rounded-2xl border p-5 shadow-sm" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{color:'#0f2044'}}>
                <Layers className="w-4 h-4" style={{color:'#D4A017'}}/> Custo por Modelo
              </h3>
              <div className="space-y-3">
                {(data?.byModel || []).map((m, i) => {
                  const maxCost = data?.byModel[0]?.costUsd || 0.001
                  const pct = fmtPct(m.costUsd, maxCost)
                  const cor = m.cor || modelColor(m.modelId)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background: cor}}/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium" style={{color:'#222'}}>{m.label || m.modelId}</span>
                          <span className="text-xs ml-2" style={{color:'#888'}}>
                            {m.calls}x · {showBrl ? fmtBrl(m.costBrl) : fmtUsd(m.costUsd)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{background:'#f0f2f5'}}>
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background: cor}}/>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {!data?.byModel.length && (
                  <p className="text-xs text-center py-6" style={{color:'#ccc'}}>Nenhum dado ainda.</p>
                )}
              </div>
            </div>

            {/* Execuções recentes */}
            <div className="lg:col-span-2 rounded-2xl border p-5 shadow-sm" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{color:'#0f2044'}}>
                <Clock className="w-4 h-4" style={{color:'#D4A017'}}/> Execuções Recentes
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(data?.recentLogs || []).map((log, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0" style={{borderColor:'#f5f5f5'}}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background: modelColor(log.modelUsed)}}/>
                    <span className="text-xs font-medium w-36 truncate" style={{color:'#222'}}>
                      {AGENT_EMOJI[log.agentId] || '🤖'} {log.agentId.replace('ben-','')}
                    </span>
                    <span className="text-xs w-28 truncate" style={{color:'#888'}}>{log.modelUsed}</span>
                    <span className="text-xs w-16 text-right" style={{color:'#555'}}>{fmtK(log.inputTokens+log.outputTokens)} tok</span>
                    <span className="text-xs w-20 text-right font-medium" style={{color:'#D4A017'}}>
                      {showBrl ? fmtBrl(log.costUsd*5.75) : `$${log.costUsd.toFixed(6)}`}
                    </span>
                    <span className="text-xs w-14 text-right" style={{color:'#aaa'}}>{fmtMs(log.elapsed_ms)}</span>
                    <span className="text-xs flex-1 text-right" style={{color:'#ccc'}}>
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                ))}
                {!data?.recentLogs?.length && (
                  <p className="text-xs text-center py-6" style={{color:'#ccc'}}>Nenhuma execução registrada ainda.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── AGENTS ─────────────────────────────────────── */}
        {activeTab === 'agents' && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
            <div className="px-5 py-3 border-b" style={{borderColor:'#f0f2f5', background:'#fafbfc'}}>
              <span className="text-sm font-semibold" style={{color:'#0f2044'}}>
                Estatísticas por Agente ({data?.byAgent.length || 0})
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{borderBottom:'1px solid #f0f2f5', background:'#fafbfc'}}>
                  {['Agente','Chamadas','Tokens In','Tokens Out','Custo USD','Custo BRL'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{color:'#888'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.byAgent || []).map((a, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{borderColor:'#f5f5f5'}}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span>{AGENT_EMOJI[a.agentId] || '🤖'}</span>
                        <span className="font-medium" style={{color:'#222'}}>{a.agentId.replace('ben-','')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-semibold" style={{color:'#0f2044'}}>{a.calls}</td>
                    <td className="px-4 py-2.5" style={{color:'#059669'}}>{fmtK(a.inputTokens)}</td>
                    <td className="px-4 py-2.5" style={{color:'#7c3aed'}}>{fmtK(a.outputTokens)}</td>
                    <td className="px-4 py-2.5 font-medium" style={{color:'#D4A017'}}>{fmtUsd(a.costUsd)}</td>
                    <td className="px-4 py-2.5 font-medium" style={{color:'#d97706'}}>{fmtBrl(a.costBrl)}</td>
                  </tr>
                ))}
                {!data?.byAgent.length && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-xs" style={{color:'#ccc'}}>Nenhum dado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── MODELS ─────────────────────────────────────── */}
        {activeTab === 'models' && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
            <div className="px-5 py-3 border-b" style={{borderColor:'#f0f2f5', background:'#fafbfc'}}>
              <span className="text-sm font-semibold" style={{color:'#0f2044'}}>
                Custos por Modelo de IA ({data?.byModel.length || 0})
              </span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{borderBottom:'1px solid #f0f2f5', background:'#fafbfc'}}>
                  {['Modelo','Chamadas','Tokens In','Tokens Out','Custo USD','Custo BRL','% Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{color:'#888'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.byModel || []).map((m, i) => {
                  const total = data?.summary.totalCostUsd || 0.001
                  const pct   = ((m.costUsd/total)*100).toFixed(1)
                  const cor   = m.cor || modelColor(m.modelId)
                  return (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{borderColor:'#f5f5f5'}}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:cor}}/>
                          <span className="font-medium" style={{color:'#222'}}>{m.label || m.modelId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-semibold" style={{color:'#0f2044'}}>{m.calls}</td>
                      <td className="px-4 py-2.5" style={{color:'#059669'}}>{fmtK(m.inputTokens)}</td>
                      <td className="px-4 py-2.5" style={{color:'#7c3aed'}}>{fmtK(m.outputTokens)}</td>
                      <td className="px-4 py-2.5 font-medium" style={{color:'#D4A017'}}>{fmtUsd(m.costUsd)}</td>
                      <td className="px-4 py-2.5 font-medium" style={{color:'#d97706'}}>{fmtBrl(m.costBrl)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{background:'#f0f2f5'}}>
                            <div className="h-full rounded-full" style={{width:`${pct}%`, background:cor}}/>
                          </div>
                          <span style={{color:'#aaa'}}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!data?.byModel.length && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{color:'#ccc'}}>Nenhum dado disponível.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── LOGS ───────────────────────────────────────── */}
        {activeTab === 'logs' && (
          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{borderColor:'#f0f2f5', background:'#fafbfc'}}>
              <span className="text-sm font-semibold" style={{color:'#0f2044'}}>
                Log de Execuções — {data?.recentLogs?.length || 0} registros
              </span>
              <span className="text-xs" style={{color:'#aaa'}}>máx 500 em memória</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{borderBottom:'1px solid #f0f2f5', background:'#fafbfc'}}>
                    {['Timestamp','Agente','Modelo','Tok In','Tok Out','Custo USD','Custo BRL','Tempo','Fonte'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{color:'#888'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentLogs || []).map((log, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50 transition-colors" style={{borderColor:'#f5f5f5'}}>
                      <td className="px-3 py-2 whitespace-nowrap" style={{color:'#aaa'}}>
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 max-w-32">
                        <div className="flex items-center gap-1">
                          <span>{AGENT_EMOJI[log.agentId]||'🤖'}</span>
                          <span className="truncate" style={{color:'#222'}}>{log.agentId.replace('ben-','')}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{background:modelColor(log.modelUsed)}}/>
                          <span style={{color:'#555'}}>{log.modelUsed}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2" style={{color:'#059669'}}>{fmtK(log.inputTokens)}</td>
                      <td className="px-3 py-2" style={{color:'#7c3aed'}}>{fmtK(log.outputTokens)}</td>
                      <td className="px-3 py-2 font-medium" style={{color:'#D4A017'}}>{fmtUsd(log.costUsd)}</td>
                      <td className="px-3 py-2 font-medium" style={{color:'#d97706'}}>{fmtBrl(log.costUsd*5.75)}</td>
                      <td className="px-3 py-2" style={{color:'#aaa'}}>{fmtMs(log.elapsed_ms)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${log.source==='growth'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                          {log.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data?.recentLogs?.length && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-xs" style={{color:'#ccc'}}>Nenhum log disponível.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TRENDS ─────────────────────────────────────── */}
        {activeTab === 'trends' && (
          <div className="rounded-2xl border shadow-sm p-5" style={{background:'#ffffff', borderColor:'#e5e7eb'}}>
            <h3 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{color:'#0f2044'}}>
              <TrendingUp className="w-4 h-4" style={{color:'#D4A017'}}/> Custo Diário (últimos 30 dias)
            </h3>
            {data?.daily.length ? (
              <div className="space-y-2">
                {data.daily.map((d, i) => {
                  const pct = fmtPct(d.costUsd, maxDailyCost)
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs w-24 flex-shrink-0" style={{color:'#888'}}>{d.date}</span>
                      <div className="flex-1 h-6 rounded-lg overflow-hidden relative" style={{background:'#f0f2f5'}}>
                        <div className="h-full rounded-lg transition-all"
                          style={{width:`${pct}%`, background:'linear-gradient(90deg,#0f2044,#D4A017)'}}/>
                        <span className="absolute inset-0 flex items-center px-2 text-xs font-medium" style={{color: pct > 30 ? '#fff' : '#0f2044'}}>
                          {showBrl ? fmtBrl(d.costUsd*5.75) : fmtUsd(d.costUsd)}
                        </span>
                      </div>
                      <span className="text-xs w-10 text-right flex-shrink-0" style={{color:'#aaa'}}>{d.calls}x</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-10 h-10 mx-auto mb-3" style={{color:'#e5e7eb'}}/>
                <p className="text-sm" style={{color:'#ccc'}}>Nenhum dado de tendência disponível.</p>
                <p className="text-xs mt-1" style={{color:'#ddd'}}>Execute agentes para acumular dados de custo.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs py-2 border-t" style={{borderColor:'#e5e7eb', color:'#ccc'}}>
          <span>BEN Monitor v2.0 · Admin privado · Mauro Monção Advogados Associados</span>
          <span>Atualização automática a cada {REFRESH_INTERVAL/1000}s</span>
        </div>

      </div>
    </div>
  )
}
