// ============================================================
// BEN ECOSYSTEM IA — Gerador de .docx Profissional v3.0
// Regra canônica inegociável do escritório Mauro Monção
//
// PADRÃO OBRIGATÓRIO:
//  - Fonte: Palatino Linotype 12pt em TODO o documento
//  - Alinhamento: justificado (corpo), esquerda (títulos/seções)
//  - Espaçamento entre linhas: 1,5 (360 twips = 240×1.5)
//  - Recuo 1ª linha parágrafo corpo: 1,25 cm
//  - Margens: sup 3cm | inf 2cm | esq 3cm | dir 2cm
//  - Títulos: CAIXA ALTA, negrito, esquerda, sem recuo
//  - Subtítulos: Negrito, iniciais maiúsculas, esquerda, sem recuo
//  - Numeração progressiva: 1. / 1.1. / 1.2. / 2.
//  - Citações recuadas: 3cm esq, espaço simples, sem 1ª linha
//  - Fecho: NESTES TERMOS, PEDE DEFERIMENTO.
//  - NUNCA: #, ##, **, __, ---, >, `, *
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
  ImageRun,
  Header,
  HorizontalPositionAlign,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
} from 'docx'
import { saveAs } from 'file-saver'

// ── Constantes de formatação ─────────────────────────────────
const FONT        = 'Palatino Linotype'
const SIZE_PT     = 12
const SIZE_HALF   = SIZE_PT * 2          // half-points (docx unit)
const QUOTE_PT    = 11
const QUOTE_HALF  = QUOTE_PT * 2

// Espaçamentos em twips (1cm ≈ 567twips, 1pt ≈ 20twips)
const LINE_15     = 360     // 1.5× espaçamento (240 × 1.5)
const LINE_1      = 240     // simples

// Margens em mm → twips
const M_TOP    = convertMillimetersToTwip(30)   // 3cm
const M_BOTTOM = convertMillimetersToTwip(20)   // 2cm
const M_LEFT   = convertMillimetersToTwip(30)   // 3cm
const M_RIGHT  = convertMillimetersToTwip(20)   // 2cm

// Recuo 1ª linha corpo: 1,25cm
const INDENT_FIRST = convertMillimetersToTwip(12.5)

// Recuo bloco citação: 3cm
const INDENT_QUOTE = convertMillimetersToTwip(30)

// ── Limpa TODOS os símbolos Markdown do texto ─────────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')             // # ## ### etc
    .replace(/\*\*(.+?)\*\*/g, '$1')         // **negrito**
    .replace(/\*(.+?)\*/g, '$1')             // *itálico*
    .replace(/_{2}(.+?)_{2}/g, '$1')         // __negrito__
    .replace(/_(.+?)_/g, '$1')               // _itálico_
    .replace(/~~(.+?)~~/g, '$1')             // ~~tachado~~
    .replace(/`{1,3}[^`]+`{1,3}/g, (m) => m.replace(/`/g, ''))
    .replace(/^\s*[-*+]\s+/gm, '')           // listas - * +
    .replace(/^[-=_]{3,}$/gm, '')            // separadores
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')  // imagens md
    .replace(/^>\s?/gm, '')                  // blockquotes
    .replace(/\\\*/g, '*')                   // escapes
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .trim()
}

// ── Tipos de linha ────────────────────────────────────────────
type LineType =
  | 'empty'
  | 'title'         // TÍTULO PRINCIPAL — centralizado, CAPS, negrito
  | 'section'       // 1. SEÇÃO / — DOS FATOS / I. DOS FATOS
  | 'subsection'    // 1.1. Subtítulo / 1.2. Subtítulo
  | 'bold_line'     // linha cabeçalho curta negrito (Processo nº, Autor:)
  | 'quote_start'   // marcador de início de bloco de citação [CITAÇÃO]
  | 'quote_end'     // marcador de fim [/CITAÇÃO]
  | 'quote_body'    // linha dentro de bloco de citação
  | 'closing'       // NESTES TERMOS / LOCAL, DATA / assinatura
  | 'body'          // parágrafo normal

function classifyLine(raw: string, inQuote: boolean): { type: LineType; text: string } {
  const clean = stripMarkdown(raw)

  if (!clean) return { type: 'empty', text: '' }
  if (/^[-=_]{3,}$/.test(clean)) return { type: 'empty', text: '' }

  // Marcadores de bloco de citação (aceita maiúsculas ou minúsculas)
  if (/^\[CITAÇÃO\]$/i.test(clean)) return { type: 'quote_start', text: '' }
  if (/^\[\/CITAÇÃO\]$/i.test(clean)) return { type: 'quote_end', text: '' }
  if (inQuote) return { type: 'quote_body', text: clean }

  // Fecho / assinatura
  if (/^(NESTES TERMOS|PEDE DEFERIMENTO|TERMOS EM QUE|Nestes termos|Pede deferimento)/i.test(clean))
    return { type: 'closing', text: clean }

  const isAllCaps = clean === clean.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(clean)
  const wordCount = clean.trim().split(/\s+/).length

  // Seção com travessão: — DOS FATOS, — DA FUNDAMENTAÇÃO
  if (/^[—–-]\s*[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(clean)) return { type: 'section', text: clean }

  // Seção numérica principal: 1. TÍTULO / 2. TÍTULO (CAPS obrigatório)
  if (/^\d{1,2}\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // Seção romana: I. TÍTULO (CAPS)
  if (/^(I{1,3}V?|IV|VI{0,3}|IX|X{1,3})\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // Subseção numerada: 1.1. / 1.1 / 2.3.
  if (/^\d{1,2}\.\d{1,2}\.?\s+[A-ZÁÉÍÓÚ]/.test(clean))
    return { type: 'subsection', text: clean }

  // Título principal: CAPS, curto (≤8 palavras), sem ponto final
  if (isAllCaps && wordCount <= 8 && !clean.endsWith('.') && wordCount >= 1)
    return { type: 'title', text: clean }

  // Linha cabeçalho bold: "Processo nº", "Autor:", "Réu:", etc.
  if (
    wordCount <= 12 &&
    /^(Processo|Autos|Ação|Autor|Réu|Requerente|Requerido|Apelante|Apelado|Consulente|Impugnante|Impugnado|Embargante|Embargado|Exequente|Executado|Paciente|Impetrante|Recorrente|Recorrido|Agravante|Agravado|Cliente|Espólio|Inventariante|Data|Assunto|Ref\.|Referência|OAB|CNPJ|CPF)\s*[:\-]/i.test(clean)
  )
    return { type: 'bold_line', text: clean }

  return { type: 'body', text: clean }
}

// ── TextRun com inline bold ───────────────────────────────────
function inlineRuns(text: string, opts: { size?: number; bold?: boolean } = {}): TextRun[] {
  const sz   = (opts.size ?? SIZE_HALF)
  const runs: TextRun[] = []
  // Processa **negrito** inline (antes do strip completo, apenas bold)
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
  for (const part of parts) {
    if (/^(\*\*|__)/.test(part)) {
      const inner = part.replace(/^\*\*|\*\*$|^__|__$/g, '')
      runs.push(new TextRun({ text: inner, bold: true, font: FONT, size: sz }))
    } else if (part) {
      runs.push(new TextRun({ text: part, bold: opts.bold ?? false, font: FONT, size: sz }))
    }
  }
  return runs.length ? runs : [new TextRun({ text, bold: opts.bold ?? false, font: FONT, size: sz })]
}

// ── Construtores de parágrafo ─────────────────────────────────

// Corpo: justificado, recuo 1,25cm, espaç 1,5
function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: inlineRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_15, before: 0, after: 0 },
    indent: { firstLine: INDENT_FIRST },
  })
}

// Seção principal (1. DOS FATOS / — DOS FATOS): CAPS, negrito, esquerda
function sectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 280, after: 100 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Subseção (1.1. Subtítulo): negrito, iniciais maiúsculas, esquerda
function subsectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 200, after: 80 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Título principal: CAPS, negrito, centralizado
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_15, before: 160, after: 160 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Linha cabeçalho bold (Processo nº, Autor:)
function boldLineParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 60, after: 60 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Bloco de citação: recuo 3cm esq, simples
function quoteParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: QUOTE_HALF })],
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_1, before: 60, after: 60 },
    indent: { left: INDENT_QUOTE, firstLine: 0 },
  })
}

// Fecho/assinatura: esquerda, sem recuo
function closingParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 60, after: 60 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Linha vazia
function emptyParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', font: FONT, size: SIZE_HALF })],
    spacing: { before: 0, after: 0, line: LINE_15 },
  })
}

// ── Carrega imagem do timbre ──────────────────────────────────
async function loadTimbreImage(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch('/timbre.png')
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

// ════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL EXPORTADA
// ════════════════════════════════════════════════════════════
export async function downloadDocx(
  content: string,
  title: string,
  agentName = 'BEN Agente Jurídico',
  withTimbre = false,
): Promise<void> {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  let consecutiveEmpty = 0
  let inQuote = false

  for (const line of lines) {
    const { type, text } = classifyLine(line, inQuote)

    if (type === 'quote_start') {
      inQuote = true
      children.push(emptyParagraph())
      continue
    }
    if (type === 'quote_end') {
      inQuote = false
      children.push(emptyParagraph())
      continue
    }

    if (type === 'empty') {
      consecutiveEmpty++
      if (consecutiveEmpty === 1) children.push(emptyParagraph())
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
      case 'quote_body':
        children.push(quoteParagraph(text))
        break
      case 'closing':
        children.push(closingParagraph(text))
        break
      case 'body':
      default:
        children.push(bodyParagraph(text))
        break
    }
  }

  // ── Configuração do documento ────────────────────────────
  const docConfig: ConstructorParameters<typeof Document>[0] = {
    creator: `BEN Ecosystem IA — ${agentName}`,
    title,
    description: `Gerado por ${agentName} — Mauro Monção Advogados Associados`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_HALF },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LINE_15 },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    M_TOP,
            bottom: M_BOTTOM,
            left:   M_LEFT,
            right:  M_RIGHT,
          },
        },
      },
      children,
    }],
  }

  // ── Adiciona timbre no cabeçalho (header) se solicitado ──
  if (withTimbre) {
    const imgBuffer = await loadTimbreImage()
    if (imgBuffer) {
      // Dimensões do timbre: 7555850 EMU x 10635088 EMU (do XML original)
      // Mas como cabeçalho de página A4 (largura 21cm = 7560000 EMU)
      // Vamos usar a imagem como header inline, largura completa da página útil
      // Largura útil = 21cm - 3cm - 2cm = 16cm = convertMillimetersToTwip(160) twips
      // Para ImageRun precisamos de width/height em EMUs: 1cm = 360000 EMU
      const pageUsableWidthEmu = 160 * 36000  // 16cm em EMU (1mm=36000 EMU)

      // Proporção original: 7555850 / 10635088 ≈ 0.7104 (largura/altura)
      // Mas queremos apenas o topo (logomarca), não a página inteira
      // Vamos usar altura proporcional para caber no cabeçalho: ~3cm = 108000 EMU
      const headerHeightEmu = 30 * 36000  // 3cm

      const imageRun = new ImageRun({
        data: imgBuffer,
        transformation: {
          width:  Math.round(pageUsableWidthEmu / 9144),   // converter para pontos/twips
          height: Math.round(headerHeightEmu / 9144),
        },
        type: 'png',
      })

      docConfig.sections![0].headers = {
        default: new Header({
          children: [
            new Paragraph({
              children: [imageRun],
              spacing: { before: 0, after: 200 },
            }),
          ],
        }),
      }
    }
  }

  const doc = new Document(docConfig)
  const buffer = await Packer.toBlob(doc)

  const safe = title
    .replace(/[^a-z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ ]/gi, '_')
    .trim()
    .slice(0, 80)
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  saveAs(buffer, `${safe}-${date}.docx`)
}
