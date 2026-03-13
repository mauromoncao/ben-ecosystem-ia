// ══════════════════════════════════════════════════════════════
// BEN ASSISTENTE GERAL — Chat Fixo Universal
// Copiloto do Dr. Mauro | GPT-4o | Persistente | Proativo
// ══════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, X, Minimize2, Maximize2,
  Trash2, Bot, User, Loader2, Sparkles, ChevronDown,
  RotateCcw, Copy, Check
} from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────
interface Mensagem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  elapsed?: number;
}

// ── Constantes ───────────────────────────────────────────────
const STORAGE_KEY = 'ben_assistente_geral_msgs';
const MAX_MSGS_STORAGE = 100;
const JURIS_API = import.meta.env.VITE_JURIS_API_URL || 'https://ben-juris-center.vercel.app';

// ── Hook: persistência no localStorage ──────────────────────
function useMensagens() {
  const [mensagens, setMensagens] = useState<Mensagem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const salvar = useCallback((msgs: Mensagem[]) => {
    setMensagens(msgs);
    try {
      // Guarda apenas as últimas MAX_MSGS_STORAGE
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_MSGS_STORAGE)));
    } catch { /* quota exceeded — ignora */ }
  }, []);

  const addMensagem = useCallback((msg: Mensagem) => {
    setMensagens(prev => {
      const nova = [...prev, msg];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nova.slice(-MAX_MSGS_STORAGE))); }
      catch { /* ignora */ }
      return nova;
    });
  }, []);

  const limpar = useCallback(() => {
    salvar([]);
    localStorage.removeItem(STORAGE_KEY);
  }, [salvar]);

  return { mensagens, addMensagem, salvar, limpar };
}

// ── Componente: balão de mensagem ────────────────────────────
function Balao({ msg, onCopiar }: { msg: Mensagem; onCopiar: (t: string) => void }) {
  const [copiado, setCopiado] = useState(false);
  const isUser = msg.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
      onCopiar(msg.content);
    });
  };

  // Renderiza markdown simples (bold, code, listas)
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Cabeçalhos
      if (line.startsWith('### ')) return <h3 key={i} className="font-bold text-sm mt-2 mb-1" style={{ color: '#DEC078' }}>{line.slice(4)}</h3>;
      if (line.startsWith('## '))  return <h2 key={i} className="font-bold text-sm mt-3 mb-1" style={{ color: '#DEC078' }}>{line.slice(3)}</h2>;
      if (line.startsWith('# '))   return <h1 key={i} className="font-bold text-base mt-3 mb-1" style={{ color: '#DEC078' }}>{line.slice(2)}</h1>;
      // Lista
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <li key={i} className="ml-4 list-disc text-xs leading-relaxed">{renderInline(line.slice(2))}</li>;
      }
      if (/^\d+\. /.test(line)) {
        return <li key={i} className="ml-4 list-decimal text-xs leading-relaxed">{renderInline(line.replace(/^\d+\. /, ''))}</li>;
      }
      // Linha em branco
      if (line.trim() === '') return <br key={i} />;
      // Parágrafo normal
      return <p key={i} className="text-xs leading-relaxed">{renderInline(line)}</p>;
    });
  };

  const renderInline = (text: string) => {
    // bold **text** e `code`
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: '#DEC078' }}>{part.slice(1, -1)}</code>;
      return part;
    });
  };

  return (
    <div className={`flex gap-2 mb-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
        {isUser
          ? <User size={12} className="text-yellow-400" />
          : <Bot size={12} className="text-blue-400" />
        }
      </div>

      {/* Conteúdo */}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="rounded-xl px-3 py-2 text-xs leading-relaxed relative"
          style={isUser
            ? { background: 'rgba(222,192,120,0.15)', border: '1px solid rgba(222,192,120,0.25)', color: '#e2e8f0' }
            : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#e2e8f0' }
          }
        >
          <div className="space-y-0.5">{renderContent(msg.content)}</div>

          {/* Botão copiar */}
          <button
            onClick={handleCopy}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            title="Copiar"
          >
            {copiado ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
          </button>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span className="text-[10px]">
            {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.model && <span className="text-[10px]">{msg.model}</span>}
          {msg.elapsed && <span className="text-[10px]">{(msg.elapsed / 1000).toFixed(1)}s</span>}
        </div>
      </div>
    </div>
  );
}

// ── Componente: indicador de digitação ───────────────────────
function Digitando() {
  return (
    <div className="flex gap-2 mb-3">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500/20">
        <Bot size={12} className="text-blue-400" />
      </div>
      <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────
export default function AssistenteGeral() {
  const [aberto, setAberto] = useState(false);
  const [maximizado, setMaximizado] = useState(false);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [scrollAuto, setScrollAuto] = useState(true);
  const { mensagens, addMensagem, limpar } = useMensagens();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollAuto && fimRef.current) {
      fimRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens, carregando, scrollAuto]);

  // Detecta scroll manual (para parar auto-scroll)
  const handleScroll = () => {
    if (!listaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listaRef.current;
    setScrollAuto(scrollHeight - scrollTop - clientHeight < 60);
  };

  // Foca input quando abre
  useEffect(() => {
    if (aberto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [aberto]);

  // Atalho Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || carregando) return;

    setInput('');
    setErro(null);
    setScrollAuto(true);

    const msgUser: Mensagem = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: Date.now(),
    };
    addMensagem(msgUser);
    setCarregando(true);

    try {
      const res = await fetch(`${JURIS_API}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'ben-assistente-geral',
          input: texto,
          clientId: 'dr-mauro-moncao',
          context: {
            clientId: 'dr-mauro-moncao',
            fonte: 'assistente-geral-fixo',
          },
          useSearch: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      const msgBot: Mensagem = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.output || 'Sem resposta.',
        timestamp: Date.now(),
        model: data.modelUsed || data.model,
        elapsed: data.elapsed_ms,
      };
      addMensagem(msgBot);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      setErro(msg);
    } finally {
      setCarregando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleLimpar = () => {
    if (confirm('Limpar todo o histórico de conversa?')) limpar();
  };

  // ── Dimensões conforme estado ────────────────────────────
  const largura  = maximizado ? 'w-[700px]' : 'w-[360px]';
  const altura   = maximizado ? 'h-[80vh]'  : 'h-[520px]';

  // ── Botão flutuante (fechado) ────────────────────────────
  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-sans font-semibold text-sm transition-all hover:scale-105 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #19385C 0%, #1e4a7a 100%)',
          border: '1px solid rgba(222,192,120,0.40)',
          color: '#DEC078',
          boxShadow: '0 8px 32px rgba(25,56,92,0.6), 0 0 0 1px rgba(222,192,120,0.15)',
        }}
        title="Abrir BEN Assistente"
      >
        <div className="relative">
          <Bot size={18} />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#19385C] animate-pulse" />
        </div>
        <span>BEN</span>
        {mensagens.length > 0 && (
          <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {mensagens.length}
          </span>
        )}
      </button>
    );
  }

  // ── Painel aberto ────────────────────────────────────────
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 ${largura} ${altura}`}
      style={{
        background: '#111827',
        border: '1px solid rgba(222,192,120,0.25)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(222,192,120,0.10)',
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #19385C 0%, #1e4a7a 100%)',
          borderBottom: '1px solid rgba(222,192,120,0.20)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(222,192,120,0.15)', border: '1px solid rgba(222,192,120,0.30)' }}>
              <Sparkles size={16} style={{ color: '#DEC078' }} />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#19385C]" />
          </div>
          <div>
            <p className="font-bold text-sm font-serif" style={{ color: '#DEC078', letterSpacing: '-0.01em' }}>BEN Assistente</p>
            <p className="text-[10px] font-sans" style={{ color: 'rgba(159,176,215,0.80)' }}>
              {carregando ? 'Pensando...' : 'GPT-4o · Copiloto Universal'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {mensagens.length > 0 && (
            <button
              onClick={handleLimpar}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(159,176,215,0.50)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.50)')}
              title="Limpar histórico"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => setMaximizado(!maximizado)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(159,176,215,0.50)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.50)')}
            title={maximizado ? 'Minimizar' : 'Maximizar'}
          >
            {maximizado ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={() => setAberto(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(159,176,215,0.50)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(159,176,215,0.50)')}
            title="Minimizar"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* ── Lista de mensagens ──────────────────────────── */}
      <div
        ref={listaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
      >
        {mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(222,192,120,0.10)', border: '1px solid rgba(222,192,120,0.20)' }}>
              <Sparkles size={24} style={{ color: '#DEC078' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm font-serif mb-1" style={{ color: '#DEC078' }}>BEN está pronto</p>
              <p className="text-xs font-sans" style={{ color: 'rgba(159,176,215,0.60)' }}>
                Pergunte qualquer coisa.<br />Direito, negócios, tecnologia, ciências...<br />Sem limites.
              </p>
            </div>
            {/* Sugestões rápidas */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'O que é RAG em IA?',
                'Me dê 3 dicas de produtividade',
                'Explica blockchain em 2 min',
                'Como estruturar uma holding?',
              ].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                  className="text-[10px] px-2.5 py-1.5 rounded-full font-sans transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(159,176,215,0.80)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(222,192,120,0.10)'; e.currentTarget.style.color = '#DEC078'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(159,176,215,0.80)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map(msg => (
          <Balao key={msg.id} msg={msg} onCopiar={() => {}} />
        ))}

        {carregando && <Digitando />}

        {erro && (
          <div className="flex items-start gap-2 mb-3 p-2.5 rounded-xl" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <span className="text-red-400 text-xs flex-1">{erro}</span>
            <button onClick={() => setErro(null)} className="text-red-400 hover:text-red-300">
              <X size={12} />
            </button>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* Botão scroll para baixo */}
      {!scrollAuto && (
        <button
          onClick={() => { setScrollAuto(true); fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
          className="absolute bottom-16 right-4 p-1.5 rounded-full shadow-lg transition-all"
          style={{ background: 'rgba(25,56,92,0.9)', border: '1px solid rgba(222,192,120,0.30)', color: '#DEC078' }}
        >
          <ChevronDown size={14} />
        </button>
      )}

      {/* ── Input ──────────────────────────────────────── */}
      <div
        className="px-3 py-2.5 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte qualquer coisa..."
            rows={1}
            disabled={carregando}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-xs font-sans outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0',
              maxHeight: '96px',
              lineHeight: '1.5',
              scrollbarWidth: 'none',
            }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 96) + 'px';
            }}
          />
          <button
            onClick={enviar}
            disabled={!input.trim() || carregando}
            className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={input.trim() && !carregando
              ? { background: '#DEC078', color: '#19385C' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', cursor: 'not-allowed' }
            }
            title="Enviar (Enter)"
          >
            {carregando
              ? <Loader2 size={14} className="animate-spin" />
              : <Send size={14} />
            }
          </button>
        </div>
        <p className="text-[10px] mt-1.5 font-sans text-center" style={{ color: 'rgba(255,255,255,0.20)' }}>
          Enter para enviar · Shift+Enter nova linha · Memória persistente ativa
        </p>
      </div>
    </div>
  );
}
