import React, { useState } from 'react'
import { Sparkles, Mail, Lock, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]     = useState('')
  const [senha, setSenha]     = useState('')
  const [show, setShow]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    const ok = await login(email, senha)
    setLoading(false)
    if (!ok) setErro('E-mail ou senha incorretos. Verifique suas credenciais.')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2044 50%, #1a3060 100%)' }}>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #D4A017, #b8860b)' }}>
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Ben Ecosystem IA</h1>
        <p className="text-sm mt-1" style={{ color: '#D4A017' }}>
          Workspace de Agentes de Inteligência Artificial
        </p>
        <p className="text-xs text-gray-400 mt-1">Mauro Monção Advogados Associados</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl shadow-2xl p-8"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,160,23,0.2)', backdropFilter: 'blur(16px)' }}>

        <h2 className="text-white text-lg font-semibold mb-6 text-center">Acesso ao Workspace</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-mail */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#D4A017' }}>E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                onFocus={e => (e.target.style.borderColor = '#D4A017')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#D4A017' }}>Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type={show ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff' }}
                onFocus={e => (e.target.style.borderColor = '#D4A017')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2 border border-red-800/30">
              {erro}
            </p>
          )}

          {/* Botão */}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 flex items-center justify-center gap-2"
            style={{ background: loading ? '#b8860b' : 'linear-gradient(135deg, #D4A017, #b8860b)', color: '#0f2044' }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Autenticando...</> : 'Entrar no Workspace'}
          </button>
        </form>

        {/* Links HUB */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-center text-xs text-gray-500 mb-3">Parte do ecossistema</p>
          <div className="flex gap-2 justify-center">
            <a href="https://bengrowth.mauromoncao.adv.br" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Growth Center
            </a>
            <span className="text-gray-600">·</span>
            <a href="https://juris.mauromoncao.adv.br" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> Juris Center
            </a>
            <span className="text-gray-600">·</span>
            <a href="https://hub.mauromoncao.adv.br" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors">
              <ExternalLink className="w-3 h-3" /> HUB
            </a>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-6">
        © 2026 Mauro Monção Advogados Associados · Ben Ecosystem IA
      </p>
    </div>
  )
}
