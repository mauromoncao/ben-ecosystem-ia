// ============================================================
// BEN JURIS CENTER — Gerador de .docx Profissional v2.0
// Padrão: Palatino Linotype 12pt, justificado, sem Markdown
//
// Regras de formatação (espelho do modelo PETIÇÃO):
//  - Fonte: Palatino Linotype 12pt em TODO o documento
//  - Alinhamento: justificado (exceto títulos centralizados)
//  - Espaçamento: 240twips antes de seção, 160 entre parágrafos
//  - Títulos de seção (— DOS FATOS, etc.): negrito, sem markdown
//  - Subtítulos numerados (1.1, 2.3): negrito
//  - Parágrafos corpo: normal, justificado
//  - NUNCA: #, ##, ###, **, __, --, ***, ---
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from 'docx'
import { saveAs } from 'file-saver'

// ── Fonte e tamanho padrão ────────────────────────────────────
const FONT      = 'Palatino Linotype'
const SIZE_PT   = 12         // pontos
const SIZE_HALF = SIZE_PT * 2 // docx usa half-points

// ── Limpa TODOS os símbolos Markdown do texto ─────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')           // # ## ### etc
    .replace(/\*\*(.+?)\*\*/g, '$1')       // **negrito**
    .replace(/\*(.+?)\*/g, '$1')           // *itálico*
    .replace(/_{2}(.+?)_{2}/g, '$1')       // __negrito__
    .replace(/_(.+?)_/g, '$1')             // _itálico_
    .replace(/~~(.+?)~~/g, '$1')           // ~~tachado~~
    .replace(/`{1,3}(.+?)`{1,3}/g, '$1')  // `código`
    .replace(/^\s*[-*+]\s+/gm, '')         // listas com - * +
    .replace(/^\s*\d+\.\s+/gm, '')         // listas numeradas
    .replace(/^[-=]{3,}$/gm, '')           // --- === separadores
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')  // imagens
    .replace(/>\s+/gm, '')                 // blockquotes
    .replace(/\\\*/g, '*')                 // escapes
    .trim()
}

// ── Detecta o tipo da linha ──────────────────────────────────
type LineType =
  | 'empty'
  | 'title'          // TÍTULO PRINCIPAL (tudo maiúsculo, curto)
  | 'section'        // — DOS FATOS / I. DOS FATOS / 1. DOS FATOS
  | 'subsection'     // 1.1 / 2.3 / subtítulo numerado
  | 'bold_line'      // linha curta toda em negrito (cabeçalho de partes)
  | 'body'           // parágrafo normal

function classifyLine(raw: string): { type: LineType; text: string } {
  // Primeiro strip markdown para análise limpa
  const text = stripMarkdown(raw)

  if (!text) return { type: 'empty', text: '' }

  // Separadores horizontais → ignorar
  if (/^[-=_]{3,}$/.test(text)) return { type: 'empty', text: '' }

  // Título principal: ALL CAPS, sem ponto final, até 80 chars
  const isAllCaps = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(text)
  const isShort   = text.length <= 80

  // Seção com traço: — DOS FATOS, — DAS PRELIMINARES
  const isDashSection = /^[—–-]\s+[A-ZÁÉÍÓÚ]/.test(text)

  // Seção numerada romana ou árabe: I. DOS FATOS | 1. DOS FATOS
  const isRomanSection = /^(I{1,3}V?|IV|VI{0,3}|IX|X{0,3})\.\s+[A-ZÁÉÍÓÚ]/.test(text) && isAllCaps
  const isNumSection   = /^\d{1,2}\.\s+[A-ZÁÉÍÓÚ]/.test(text) && isAllCaps

  // Subseção numerada: 1.1 | 2.3 | 1.1.1
  const isSubSection = /^\d{1,2}\.\d{1,2}\.?\d*\s+[A-ZÁÉÍÓÚ]/.test(text)

  // Linha curta bold (cabeçalho): "Autor:", "Réu:", "Processo nº", etc.
  const isBoldHeader = isShort && /^(Processo|Autor|Réu|Requerente|Requerido|Apelante|Apelado|Consulente|Assunto|Data|Exequente|Executado|Impugnante|Impugnado|Recorrente|Recorrido|Agravante|Agravado|Embargante|Embargado|Paciente|Impetrante|AUTOR|RÉU)[\s:]/i.test(text)

  if (isDashSection || isRomanSection || isNumSection) return { type: 'section', text }
  if (isSubSection)  return { type: 'subsection', text }
  if (isAllCaps && isShort && !text.includes(' ')) return { type: 'title', text } // palavra única maiúscula = tipo doc
  if (isAllCaps && isShort && text.split(' ').length <= 6) return { type: 'title', text }
  if (isBoldHeader)  return { type: 'bold_line', text }
  if (isAllCaps && isShort) return { type: 'section', text } // ALL CAPS curto = seção
  return { type: 'body', text }
}

// ── Converte linha de inline markdown para TextRun[] ─────────
function inlineRuns(text: string): TextRun[] {
  // Processa **negrito** inline dentro de parágrafos de corpo
  const runs: TextRun[] = []
  // Regex captura texto antes/depois de marcadores bold
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
  for (const part of parts) {
    if (/^(\*\*|__)/.test(part)) {
      const inner = part.replace(/^\*\*|\*\*$|^__|__$/g, '')
      runs.push(new TextRun({ text: inner, bold: true, font: FONT, size: SIZE_HALF }))
    } else if (part) {
      runs.push(new TextRun({ text: part, font: FONT, size: SIZE_HALF }))
    }
  }
  return runs.length ? runs : [new TextRun({ text, font: FONT, size: SIZE_HALF })]
}

// ── Cria parágrafo body com inline bold ──────────────────────
function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: inlineRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, before: 0, after: 120 },
    indent: { firstLine: convertInchesToTwip(0) },
  })
}

// ── Cria parágrafo de seção (— DOS FATOS) ────────────────────
function sectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 280, after: 160, line: 360 },
  })
}

// ── Cria parágrafo de subseção (1.1 Subtítulo) ───────────────
function subsectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 360 },
  })
}

// ── Cria parágrafo de título (CONTESTAÇÃO / PARECER) ─────────
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200, line: 360 },
  })
}

// ── Cria parágrafo de cabeçalho bold (Processo nº, Autor:) ───
function boldLineParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 80, after: 80, line: 360 },
  })
}

// ── Parágrafo vazio (espaçamento entre blocos) ────────────────
function emptyParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', font: FONT, size: SIZE_HALF })],
    spacing: { before: 0, after: 80 },
  })
}

// ════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL EXPORTADA
// ════════════════════════════════════════════════════════════
export async function downloadDocx(
  content: string,
  title: string,
  agentName = 'BEN Agente Jurídico',
): Promise<void> {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  let consecutiveEmpty = 0

  for (const line of lines) {
    const { type, text } = classifyLine(line)

    if (type === 'empty') {
      consecutiveEmpty++
      // No máximo 1 linha em branco seguida
      if (consecutiveEmpty <= 1) children.push(emptyParagraph())
      continue
    }

    consecutiveEmpty = 0

    switch (type) {
      case 'title':
        children.push(titleParagraph(text))
        break
      case 'section':
        children.push(sectionParagraph(text))
        break
      case 'subsection':
        children.push(subsectionParagraph(text))
        break
      case 'bold_line':
        children.push(boldLineParagraph(text))
        break
      case 'body':
      default:
        children.push(bodyParagraph(text))
        break
    }
  }

  const doc = new Document({
    creator: `BEN Ecosystem IA — ${agentName}`,
    title,
    description: `Documento gerado por ${agentName} — Mauro Monção Advogados Associados`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_HALF },
          paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { line: 360 } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1.18), // 3cm
            bottom: convertInchesToTwip(0.79), // 2cm
            left:   convertInchesToTwip(1.18), // 3cm
            right:  convertInchesToTwip(0.79), // 2cm
          },
        },
      },
      children,
    }],
  })

  const buffer = await Packer.toBlob(doc)
  const filename = `${title.replace(/[^a-z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ ]/gi, '_').trim()}-${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`
  saveAs(buffer, `${filename}.docx`)
}
