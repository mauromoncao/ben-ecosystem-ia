import React, { useState } from 'react'
import {
  Brain, Cpu, Scale, TrendingUp, Users, MessageSquare, FileText,
  Zap, Activity, BarChart3, CheckCircle2, Clock, AlertCircle,
  DollarSign, Globe, Database, Bot, Sparkles, ArrowUpRight,
  Building2, Target, Layers
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'

// ─── dados Mock — Março 2026 ──────────────────────────────────────────────────
const agentUsageData = [
  { dia: '01/03', juridico: 124, contador: 67, growth: 45, sistema: 89 },
  { dia: '03/03', juridico: 142, contador: 78, growth: 52, sistema: 103 },
  { dia: '05/03', juridico: 156, contador: 82, growth: 61, sistema: 118 },
  { dia: '07/03', juridico: 134, contador: 71, growth: 48, sistema: 97  },
  { dia: '09/03', juridico: 189, contador: 94, growth: 73, sistema: 134 },
  { dia: '11/03', juridico: 210, contador: 108, growth: 87, sistema: 152 },
  { dia: '13/03', juridico: 197, contador: 99, growth: 79, sistema: 143 },
  { dia: '15/03', juridico: 223, contador: 118, growth: 94, sistema: 167 },
]

const tokenCostData = [
  { mes: 'Out', claude: 1240, openai: 380, gemini: 120, perplexity: 80  },
  { mes: 'Nov', claude: 1420, openai: 410, gemini: 145, perplexity: 95  },
  { mes: 'Dez', claude: 1680, openai: 450, gemini: 172, perplexity: 110 },
  { mes: 'Jan', claude: 1910, openai: 520, gemini: 198, perplexity: 125 },
  { mes: 'Fev', claude: 2340, openai: 620, gemini: 245, perplexity: 148 },
  { mes: 'Mar', claude: 2780, openai: 740, gemini: 287, perplexity: 175 },
]

const modelDistribution = [
  { name: 'Claude Opus 4',   value: 18, color: '#92400e' },
  { name: 'Claude Sonnet 4', value: 41, color: '#1d4ed8' },
  { name: 'Claude Haiku 4',  value: 22, color: '#16a34a' },
  { name: 'GPT-4o',          value: 12, color: '#0e7490' },
  { name: 'Gemini',          value:  5, color: '#7c3aed' },
  { name: 'Outros',          value:  2, color: '#6B7280' },
]

const agentActivities = [
  { id: 1, agent: 'Agente Maximus',        action: 'Elaborou petição inicial — Tributário',       status: 'success',   ts: '15/03 09:42', model: 'Claude Opus 4'   },
  { id: 2, agent: 'BEN Conteudista',       action: 'Gerou 2 artigos de blog — Tributário',        status: 'success',   ts: '15/03 09:15', model: 'GPT-4o'          },
  { id: 3, agent: 'BEN Monitor Jurídico',  action: 'Monitorando publicações DJe — 247 processos', status: 'running',   ts: '15/03 09:00', model: 'Claude Sonnet 4' },
  { id: 4, agent: 'Perito Forense',        action: 'Redigindo laudo pericial — Bancário',         status: 'running',   ts: '15/03 08:55', model: 'Claude Sonnet 4' },
  { id: 5, agent: 'BEN Analista',          action: 'Relatório de campanhas Mar/2026',             status: 'success',   ts: '15/03 08:00', model: 'Claude Haiku 4'  },
  { id: 6, agent: 'BEN Copilot',           action: 'Respostas: 34 consultas de usuários',         status: 'success',   ts: '15/03 07:30', model: 'GPT-4o'          },
  { id: 7, agent: 'Assistente CNJ',        action: 'Consultou DataJud — 12 processos',            status: 'success',   ts: '15/03 07:10', model: 'Claude Sonnet 4' },
  { id: 8, agent: 'Lex Campanhas',         action: 'Otimizou Meta Ads — ROAS 5.6x',              status: 'scheduled', ts: '15/03 10:00', model: 'GPT-4o'          },
]

const vpsServices = [
  { name: 'ben-file-parser',    port: 3010, status: 'online', version: '3.0.0', mem: '76MB',  uptime: '11m',   color: '#00b37e' },
  { name: 'ben-agents-server',  port: 3188, status: 'online', version: '6.0.0', mem: '54MB',  uptime: '10m',   color: '#00b37e' },
  { name: 'ben-api',            port: 3003, status: 'online', version: '1.0.0', mem: '58MB',  uptime: '4m',    color: '#00b37e' },
  { name: 'ben-portal',         port: 3600, status: 'online', version: '3.0.0', mem: '60MB',  uptime: '4m',    color: '#00b37e' },
  { name: 'ben-workspace',      port: 3002, status: 'online', version: '1.0.0', mem: '68MB',  uptime: '21h',   color: '#00b37e' },
  { name: 'dr-ben-leads',       port: 3001, status: 'online', version: '1.0.0', mem: '79MB',  uptime: '2d',    color: '#00b37e' },
  { name: 'blog-painel',        port: 3031, status: 'online', version: '1.0.0', mem: '61MB',  uptime: '24h',   color: '#00b37e' },
  { name: 'solucoes-painel',    port: 3030, status: 'online', version: '1.0.0', mem: '60MB',  uptime: '24h',   color: '#00b37e' },
]

// ─── estilos ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

const tooltipStyle = {
  background: '#1a2640',
  border: '1px solid #2a3a5c',
  borderRadius: 8,
  color: '#D0E4FF',
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
}

// ─── componente principal ─────────────────────────────────────────────────────
export default function DashboardEcosistema() {
  const [activeTab, setActiveTab] = useState<'overview' | 'agentes' | 'vps'>('overview')

  const totalTokens = 3982
  const totalCostBRL = (2780 + 740 + 287 + 175) * 0.025  // estimativa em BRL

  return (
    <div className="space-y-6">

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl px-6 py-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d1f3c 0%, #1a3560 50%, #0d2040 100%)',
          border: '1px solid rgba(228,183,30,0.25)',
          boxShadow: '0 4px 32px rgba(13,31,60,0.40)',
        }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 15% 50%, rgba(228,183,30,0.08) 0%, transparent 60%)' }} />
        <div>
          <h1 className="text-2xl font-bold font-serif" style={{ color: '#E2B714', letterSpacing: '-0.01em' }}>
            BEN Ecosystem IA
          </h1>
          <p className="text-sm mt-1 font-sans" style={{ color: 'rgba(160,196,224,0.80)' }}>
            Monitor de Agentes · VPS · Tokens · Ecossistema — Março 2026
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap relative z-10">
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(0,179,126,0.15)', border: '1px solid rgba(0,179,126,0.40)', color: '#00b37e', fontSize: '0.75rem', fontWeight: 600 }}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-sans">35 Agentes Online</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.40)', color: '#a78bfa', fontSize: '0.75rem', fontWeight: 600 }}>
            <Database size={12} /><span className="font-sans">R2 + Pinecone</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(222,192,120,0.15)', border: '1px solid rgba(222,192,120,0.40)', color: '#DEC078', fontSize: '0.75rem', fontWeight: 600 }}>
            <Globe size={12} /><span className="font-sans">CF Pages + VPS</span>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Agentes Ativos',      value: '35',           icon: Bot,          accent: '#E2B714', sub: '5 categorias',         up: true,  change: '+10' },
          { label: 'Consultas Hoje',       value: '847',          icon: MessageSquare,accent: '#00b37e', sub: 'Média: 112/h',         up: true,  change: '+34%' },
          { label: 'Docs. Processados',    value: '2.847',        icon: FileText,     accent: '#7c3aed', sub: 'R2 + Pinecone indexado',up: true,  change: '+18%' },
          { label: 'Custo IA (Mar)',       value: `R$ ${totalCostBRL.toFixed(0)}`,   icon: DollarSign, accent: '#DEC078', sub: 'Claude + OpenAI + Gemini', up: false, change: '+12%' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ ...card, borderLeft: `3px solid ${item.accent}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium font-sans" style={{ color: '#6B7280' }}>{item.label}</p>
                  <p className="text-2xl font-bold mt-1 font-sans" style={{ color: '#111827', letterSpacing: '-0.02em' }}>{item.value}</p>
                  <p className="text-xs mt-0.5 font-sans" style={{ color: '#9CA3AF' }}>{item.sub}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.accent}18` }}>
                  <Icon size={20} style={{ color: item.accent }} />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {item.up
                  ? <TrendingUp size={13} style={{ color: '#00b37e' }} />
                  : <Activity size={13} style={{ color: '#f59e0b' }} />}
                <span className="text-sm font-bold font-sans" style={{ color: item.up ? '#00b37e' : '#f59e0b' }}>{item.change}</span>
                <span className="text-xs font-sans" style={{ color: '#9CA3AF' }}>vs. mês anterior</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {[
          { key: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
          { key: 'agentes',  label: 'Agentes',     icon: Bot },
          { key: 'vps',      label: 'VPS & Infra', icon: Cpu },
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key as typeof activeTab
          return (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold font-sans transition-all"
              style={isActive
                ? { background: '#19385C', color: '#DEC078', boxShadow: '0 2px 8px rgba(25,56,92,0.20)' }
                : { ...card, color: '#6B7280' }}>
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── CONTEÚDO POR TAB ───────────────────────────────────────── */}

      {activeTab === 'overview' && (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Uso de Agentes por Categoria */}
            <div className="md:col-span-2 rounded-2xl p-5" style={card}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-sm flex items-center gap-2 font-sans" style={{ color: '#111827' }}>
                  <BarChart3 size={16} style={{ color: '#E2B714' }} />Uso de Agentes por Categoria — Mar/2026
                </span>
                <span className="text-xs px-2 py-1 rounded-lg font-sans"
                  style={{ color: '#6B7280', background: '#F3F4F6' }}>
                  Consultas/dia
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={agentUsageData}>
                  <defs>
                    <linearGradient id="jur" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#1d4ed8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cnt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#E2B714" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E2B714" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00b37e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00b37e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="dia" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="juridico"  stroke="#1d4ed8" strokeWidth={2} fill="url(#jur)"  name="Jurídico" />
                  <Area type="monotone" dataKey="contador"  stroke="#E2B714" strokeWidth={2} fill="url(#cnt)"  name="Contador" />
                  <Area type="monotone" dataKey="growth"    stroke="#00b37e" strokeWidth={2} fill="url(#gr)"   name="Growth" />
                  <Area type="monotone" dataKey="sistema"   stroke="#7c3aed" strokeWidth={1.5} fill="none"     name="Sistema" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Pie — Distribuição por Modelo */}
            <div className="rounded-2xl p-5" style={card}>
              <span className="font-bold text-sm flex items-center gap-2 mb-4 font-sans" style={{ color: '#111827' }}>
                <Brain size={16} style={{ color: '#7c3aed' }} />Modelos IA Utilizados
              </span>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={modelDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {modelDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-1">
                {modelDistribution.map(m => (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                    <span className="flex-1 font-sans truncate" style={{ color: '#6B7280' }}>{m.name}</span>
                    <span className="font-bold" style={{ color: '#111827' }}>{m.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Custo por Provedor */}
          <div className="rounded-2xl p-5" style={card}>
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-sm flex items-center gap-2 font-sans" style={{ color: '#111827' }}>
                <DollarSign size={16} style={{ color: '#DEC078' }} />Custo por Provedor IA — Out 2025 a Mar 2026 (USD)
              </span>
              <span className="text-xs font-sans" style={{ color: '#9CA3AF' }}>Tokens consumidos × preço/1M</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={tokenCostData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`$${v}`, '']} />
                <Bar dataKey="claude"     fill="#1d4ed8" radius={[4,4,0,0]} name="Claude (Anthropic)" />
                <Bar dataKey="openai"     fill="#00b37e" radius={[4,4,0,0]} name="OpenAI" />
                <Bar dataKey="gemini"     fill="#7c3aed" radius={[4,4,0,0]} name="Gemini" />
                <Bar dataKey="perplexity" fill="#DEC078" radius={[4,4,0,0]} name="Perplexity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === 'agentes' && (
        <>
          {/* KPIs de Agentes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { cat: 'Jurídico',       count: 6,  color: '#1d4ed8', icon: Scale,       total: '223/dia' },
              { cat: 'Contador',       count: 10, color: '#E2B714', icon: BarChart3,    total: '118/dia' },
              { cat: 'Perito Forense', count: 7,  color: '#7c3aed', icon: FlaskConical, total: '67/dia'  },
              { cat: 'Growth & Mkt',   count: 6,  color: '#00b37e', icon: Megaphone,    total: '94/dia'  },
              { cat: 'Sistema',        count: 6,  color: '#6B7280', icon: Cpu,          total: '167/dia' },
            ].slice(0,4).map(item => {
              const Icon = item.icon
              return (
                <div key={item.cat} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ ...card, borderLeft: `3px solid ${item.color}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.color}15` }}>
                    <Icon size={20} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium font-sans" style={{ color: '#6B7280' }}>{item.cat}</p>
                    <p className="text-xl font-bold font-sans" style={{ color: '#111827' }}>{item.count} agentes</p>
                    <p className="text-xs font-sans" style={{ color: '#9CA3AF' }}>{item.total}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Feed de Atividade */}
          <div className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
              <Activity size={16} style={{ color: '#00b37e' }} />
              <span className="font-bold text-sm font-sans" style={{ color: '#111827' }}>Feed de Atividade — Hoje</span>
              <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold font-sans"
                style={{ background: 'rgba(0,179,126,0.10)', color: '#065f46', border: '1px solid rgba(0,179,126,0.30)' }}>
                {agentActivities.length} eventos
              </span>
            </div>
            {agentActivities.map((a, i) => (
              <div key={a.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderBottom: i < agentActivities.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <div className="flex-shrink-0">
                  {a.status === 'success'   && <CheckCircle2 size={16} style={{ color: '#00b37e' }} />}
                  {a.status === 'running'   && <Clock size={16} style={{ color: '#f59e0b' }} className="animate-spin" />}
                  {a.status === 'scheduled' && <Clock size={16} style={{ color: '#9CA3AF' }} />}
                  {a.status === 'error'     && <AlertCircle size={16} style={{ color: '#e11d48' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold font-sans truncate" style={{ color: '#111827' }}>{a.action}</p>
                  <p className="text-xs font-sans mt-0.5" style={{ color: '#9CA3AF' }}>{a.agent} · {a.ts}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold flex-shrink-0"
                  style={{ background: '#F3F4F6', color: '#6B7280' }}>{a.model}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'vps' && (
        <>
          {/* Status Geral */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Serviços Online',  value: '8/8',    icon: CheckCircle2, accent: '#00b37e' },
              { label: 'CPU (VPS)',         value: '12%',    icon: Cpu,          accent: '#19385C' },
              { label: 'RAM (VPS)',         value: '22%',    icon: Layers,       accent: '#7c3aed' },
              { label: 'Disco (VPS)',       value: '16.4%',  icon: Database,     accent: '#DEC078' },
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ ...card, borderLeft: `3px solid ${item.accent}` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${item.accent}15` }}>
                    <Icon size={20} style={{ color: item.accent }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium font-sans" style={{ color: '#6B7280' }}>{item.label}</p>
                    <p className="text-xl font-bold font-sans" style={{ color: '#111827' }}>{item.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Tabela de Serviços */}
          <div className="rounded-2xl overflow-hidden" style={card}>
            <div className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
              <Building2 size={16} style={{ color: '#19385C' }} />
              <span className="font-bold text-sm font-sans" style={{ color: '#111827' }}>Serviços VPS — 181.215.135.202</span>
              <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold font-sans"
                style={{ background: 'rgba(0,179,126,0.10)', color: '#065f46', border: '1px solid rgba(0,179,126,0.30)' }}>
                Todos online
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                    {['Serviço', 'Porta', 'Versão', 'Memória', 'Uptime', 'Status'].map(h => (
                      <th key={h} className="text-xs font-bold uppercase px-4 py-3 text-left font-sans"
                        style={{ color: '#6B7280', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vpsServices.map((s, i) => (
                    <tr key={s.name}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      style={{ borderBottom: i < vpsServices.length - 1 ? '1px solid #F9FAFB' : 'none' }}>
                      <td className="px-4 py-3 text-sm font-mono font-bold" style={{ color: '#111827' }}>{s.name}</td>
                      <td className="px-4 py-3 text-sm font-sans" style={{ color: '#6B7280' }}>{s.port}</td>
                      <td className="px-4 py-3 text-sm font-sans" style={{ color: '#6B7280' }}>{s.version}</td>
                      <td className="px-4 py-3 text-sm font-sans" style={{ color: '#6B7280' }}>{s.mem}</td>
                      <td className="px-4 py-3 text-sm font-sans" style={{ color: '#6B7280' }}>{s.uptime}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans"
                          style={{ background: 'rgba(0,179,126,0.10)', color: '#065f46', border: '1px solid rgba(0,179,126,0.30)' }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          online
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cloudflare Pages */}
          <div className="rounded-2xl p-5" style={card}>
            <div className="flex items-center gap-2 mb-4">
              <Globe size={16} style={{ color: '#DEC078' }} />
              <span className="font-bold text-sm font-sans" style={{ color: '#111827' }}>Cloudflare Pages — Projetos Publicados</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Ben Juris Center',    url: 'juris.mauromoncao.adv.br',    pages: 'ben-juris-center.pages.dev',    color: '#1d4ed8', status: 'live' },
                { name: 'Ben Growth Center',   url: 'growth.mauromoncao.adv.br',   pages: 'ben-growth-center.pages.dev',   color: '#00b37e', status: 'live' },
                { name: 'Ben Ecosystem IA',    url: 'ecosystem.mauromoncao.adv.br', pages: 'ben-ecosystem-ia.pages.dev',    color: '#E2B714', status: 'live' },
              ].map(p => (
                <div key={p.name} className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-md"
                  style={{ background: `${p.color}08`, border: `1px solid ${p.color}25` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm font-sans" style={{ color: p.color }}>{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold font-sans"
                      style={{ background: 'rgba(0,179,126,0.10)', color: '#065f46' }}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs font-sans mb-1" style={{ color: '#6B7280' }}>🌐 {p.url}</p>
                  <p className="text-xs font-mono" style={{ color: '#9CA3AF', fontSize: '0.65rem' }}>{p.pages}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  )
}

// ─── ícones inline ─────────────────────────────────────────────────────────────
function FlaskConical({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" /><path d="M7 16h10" />
    </svg>
  )
}
function Megaphone({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}
function LayoutDashboard({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}
