// ══════════════════════════════════════════════════════════════
// BEN LOGO ICON — Componente canônico substituto da balança ⚖️
// REGRA CANÔNICA: NUNCA usar ⚖️ no ecossistema BEN IA.
// A balança é símbolo ultrapassado. O BEN usa sua própria logo.
// Substituto oficial: <BenLogoIcon /> em React | 🔱 em texto puro
// ══════════════════════════════════════════════════════════════

import React from 'react'

interface BenLogoIconProps {
  size?: number       // px (default: 16)
  className?: string
  style?: React.CSSProperties
  title?: string
}

export default function BenLogoIcon({
  size = 16,
  className = '',
  style = {},
  title = 'BEN IA',
}: BenLogoIconProps) {
  return (
    <img
      src="/ben-logo.png"
      alt="BEN"
      title={title}
      width={size}
      height={size}
      className={`inline-block object-contain flex-shrink-0 ${className}`}
      style={{ borderRadius: '3px', ...style }}
      onError={e => {
        // Fallback: esconde se logo não carregar
        (e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}

// ── Versão string para uso em emoji fields ───────────────────
// Quando o campo aceita apenas string (ex: emoji: '⚖️'),
// use a constante BEN_ICON_EMOJI abaixo como fallback textual.
// NUNCA use ⚖️. Use 🔱 em contextos de texto puro.
export const BEN_ICON_EMOJI = '🔱'

// ── Restrição canônica documentada ──────────────────────────
// @canonical-rule: NO_BALANCA_EMOJI
// O emoji ⚖️ (balança) está BANIDO do ecossistema BEN IA.
// Razão: símbolo ultrapassado, incompatível com advocacia moderna
// e identidade de IA. Substitutos obrigatórios:
//   - React/JSX: <BenLogoIcon /> (logo real)
//   - Strings/emoji fields: 🔱
//   - Texto WhatsApp/email/API: 🔱
