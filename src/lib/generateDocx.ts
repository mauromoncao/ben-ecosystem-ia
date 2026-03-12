// ============================================================
// BEN ECOSYSTEM IA — Gerador de .docx Profissional v5.0
// Escritório Mauro Monção Advogados Associados
//
// ╔══════════════════════════════════════════════════════════╗
// ║   PADRÃO CANÔNICO INEGOCIÁVEL — BASEADO NO ARQUIVO      ║
// ║   EDITADO PELO DR. MAURO MONÇÃO (referência mestre)     ║
// ╠══════════════════════════════════════════════════════════╣
// ║ FONTE: Palatino Linotype 12pt em TODO o documento       ║
// ║ ALINHAMENTO: justificado (corpo) | esquerda (seções)    ║
// ║              centralizado (título + assinatura)         ║
// ║ ESPAÇAMENTO LINHAS: 1,5× corpo | 1,0× citações         ║
// ║ RECUO 1ª LINHA CORPO: 1,25 cm                          ║
// ║ MARGENS: sup 3cm | inf 2cm | esq 3cm | dir 2cm         ║
// ║                                                          ║
// ║ TÍTULOS DE SEÇÃO:                                        ║
// ║   · CAIXA ALTA · negrito · esquerda · SEM TRAVESSÃO    ║
// ║   · SpBef=16pt SpAft=6pt                                ║
// ║   · Formato: "DOS FATOS" (sem "—")                      ║
// ║                                                          ║
// ║ SUBSEÇÕES:                                               ║
// ║   · "4.1. Título" · negrito · esquerda · SpBef=0pt      ║
// ║                                                          ║
// ║ EMENTA:                                                  ║
// ║   · "EMENTA: texto" · recuo esq 3cm · IndFirst=0        ║
// ║                                                          ║
// ║ PARÁGRAFOS DE CORPO:                                     ║
// ║   · SEM linha vazia entre parágrafos consecutivos       ║
// ║   · SpBef=0 SpAft=0 — o LS 1,5 já cria o visual        ║
// ║                                                          ║
// ║ BLOCO DE CITAÇÃO [CITAÇÃO]...[/CITAÇÃO]:                ║
// ║   · IndLeft=3cm · IndFirst=0 · LS=1,0 · 12pt           ║
// ║   · texto normal → itálico                              ║
// ║   · **termo** → negrito+itálico (destaque persuasivo)   ║
// ║   · (grifei) → negrito romano                           ║
// ║   · (STF/STJ...) ao final DO MESMO parágrafo, normal   ║
// ║     — NÃO é parágrafo separado                          ║
// ║                                                          ║
// ║ [ALERTA]termo[/ALERTA] no corpo → negrito 12pt          ║
// ║                                                          ║
// ║ ASSINATURA (3 linhas):                                   ║
// ║   · CENTER · bold · SpBef=0 SpAft=0 · LS=simples        ║
// ║   · "MAURO MONCAO DA SILVA" / "Advogado" / "OAB/CE..."  ║
// ║                                                          ║
// ║ TIMBRE: arquivo Word SEPARADO — o sistema gera o        ║
// ║   conteúdo; o timbre é injetado via template ZIP        ║
// ║                                                          ║
// ║ PROIBIDO: # ## ** __ --- > ` markdown de qualquer tipo  ║
// ╚══════════════════════════════════════════════════════════╝
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
} from 'docx'
import { saveAs } from 'file-saver'
import PizZip from 'pizzip'

// ── Constantes de formatação ─────────────────────────────────
const FONT      = 'Palatino Linotype'
const SIZE_PT   = 12
const SIZE_HALF = SIZE_PT * 2   // half-points (unidade do docx)

// Espaçamentos em twips (1pt = 20twips, 240 = 1 linha simples)
const LINE_15   = 360   // 1,5× espaçamento
const LINE_1    = 240   // simples

// Margens em mm → twips
const M_TOP    = convertMillimetersToTwip(30)
const M_BOTTOM = convertMillimetersToTwip(20)
const M_LEFT   = convertMillimetersToTwip(30)
const M_RIGHT  = convertMillimetersToTwip(20)

// Recuos
const INDENT_FIRST = convertMillimetersToTwip(12.5) // 1,25cm — 1ª linha corpo
const INDENT_QUOTE = convertMillimetersToTwip(30)   // 3cm — bloco citação + ementa

// ── Nomes do bloco de assinatura ─────────────────────────────
const SIGNATURE_NAMES = ['MAURO MONCAO DA SILVA', 'MAURO MONÇÃO DA SILVA']
const SIGNATURE_ROLES = ['Advogado', 'advogado']
const SIGNATURE_OAB_RE = /^OAB\//i

// ── Limpa símbolos Markdown do texto ─────────────────────────
// ATENÇÃO: não remove ** aqui — processado depois span a span
function stripMarkdownLight(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/_{2}(.+?)_{2}/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`{1,3}[^`]+`{1,3}/g, (m) => m.replace(/`/g, ''))
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^[-=_]{3,}$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^>\s?/gm, '')
    .replace(/\\\*/g, '*')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .trim()
}

// ── Tipos de linha ────────────────────────────────────────────
type LineType =
  | 'empty'
  | 'title'        // TÍTULO PRINCIPAL — CAPS · negrito · centralizado
  | 'section'      // DOS FATOS / DA CONSULTA — CAPS · negrito · esquerda (SEM travessão)
  | 'subsection'   // 4.1. Subtítulo — negrito · esquerda
  | 'ementa'       // EMENTA: texto — recuo 3cm
  | 'bold_line'    // Processo nº / Autor: — negrito · esquerda
  | 'quote_start'  // [CITAÇÃO]
  | 'quote_end'    // [/CITAÇÃO]
  | 'quote_body'   // linha dentro de bloco de citação
  | 'closing'      // NESTES TERMOS / LOCAL, DATA
  | 'signature'    // MAURO MONCAO / Advogado / OAB
  | 'body'         // parágrafo normal

function classifyLine(
  raw: string,
  inQuote: boolean,
): { type: LineType; text: string } {
  const clean = stripMarkdownLight(raw)

  if (!clean) return { type: 'empty', text: '' }
  if (/^[-=_]{3,}$/.test(clean)) return { type: 'empty', text: '' }

  // Marcadores de citação
  if (/^\[CITAÇÃO\]$/i.test(clean))  return { type: 'quote_start', text: '' }
  if (/^\[\/CITAÇÃO\]$/i.test(clean)) return { type: 'quote_end',  text: '' }

  // Dentro de citação — tudo é quote_body (incluindo a referência "(STF...)")
  if (inQuote) return { type: 'quote_body', text: clean }

  // Ementa
  if (/^EMENTA\s*:/i.test(clean)) return { type: 'ementa', text: clean }

  // Fecho
  if (/^(NESTES TERMOS|PEDE DEFERIMENTO|TERMOS EM QUE|Nestes termos|Pede deferimento|Respeitosamente|Atenciosamente)/i.test(clean))
    return { type: 'closing', text: clean }

  // Assinatura (3 linhas compactas)
  if (SIGNATURE_NAMES.some(n => clean.toUpperCase().includes(n.toUpperCase())))
    return { type: 'signature', text: clean }
  if (SIGNATURE_ROLES.some(r => clean.trim() === r))
    return { type: 'signature', text: clean }
  if (SIGNATURE_OAB_RE.test(clean.trim()))
    return { type: 'signature', text: clean }

  const isAllCaps = clean === clean.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(clean)
  const wordCount = clean.trim().split(/\s+/).length

  // ── SEÇÃO: numérica com CAPS  ex: "1. DOS FATOS" / "5. DA EXCEÇÃO..."
  // Aceita CAPS obrigatório
  if (/^\d{1,2}\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // ── SEÇÃO: romana com CAPS  ex: "I. DOS FATOS"
  if (/^(I{1,3}V?|IV|VI{0,3}|IX|X{1,3})\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // ── SEÇÃO: palavra(s) CAPS sem número (ex: "DOS FATOS", "DA CONSULTA")
  // Deve ser linha curta (≤8 palavras) e toda em CAPS e não terminar com ponto
  if (isAllCaps && wordCount <= 8 && !clean.endsWith('.') && !clean.endsWith(','))
    return { type: 'section', text: clean }

  // ── SEÇÃO: com travessão (legado — remover o travessão e tratar como seção)
  if (/^[—–]\s*[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(clean)) {
    const withoutDash = clean.replace(/^[—–]\s*/, '').trim()
    return { type: 'section', text: withoutDash.toUpperCase() }
  }

  // ── SUBSEÇÃO: "4.1. Título" / "1.2. Texto"
  if (/^\d{1,2}\.\d{1,2}\.?\s+[A-ZÁÉÍÓÚa-záéíóú]/.test(clean))
    return { type: 'subsection', text: clean }

  // ── TÍTULO PRINCIPAL: CAPS curto (≤6 palavras), sem ponto final, sem número
  if (isAllCaps && wordCount <= 6 && !clean.endsWith('.') && !/^\d/.test(clean))
    return { type: 'title', text: clean }

  // ── Linha cabeçalho bold (Processo nº / Autor: etc)
  if (
    wordCount <= 12 &&
    /^(Processo|Autos|Ação|Autor|Réu|Requerente|Requerido|Apelante|Apelado|Consulente|Impugnante|Impugnado|Embargante|Embargado|Exequente|Executado|Paciente|Impetrante|Recorrente|Recorrido|Agravante|Agravado|Cliente|Espólio|Inventariante|Data|Assunto|Ref\.|Referência|CNPJ|CPF)\s*[:\-]/i.test(clean)
  )
    return { type: 'bold_line', text: clean }

  return { type: 'body', text: clean }
}

// ── Processador de [ALERTA] no corpo ─────────────────────────
// [ALERTA]termo[/ALERTA] → negrito 12pt
// **termo** inline → negrito 12pt
function parseAlerta(text: string): TextRun[] {
  const runs: TextRun[] = []
  // Primeiro split por [ALERTA]
  const parts = text.split(/(\[ALERTA\].*?\[\/ALERTA\])/gi)
  for (const part of parts) {
    const alertMatch = part.match(/^\[ALERTA\](.*?)\[\/ALERTA\]$/i)
    if (alertMatch) {
      runs.push(new TextRun({ text: alertMatch[1], bold: true, font: FONT, size: SIZE_HALF }))
    } else if (part) {
      // processar **bold** inline
      const subParts = part.split(/(\*\*[^*]+\*\*|__[^_]+__)/g)
      for (const sp of subParts) {
        if (/^(\*\*|__)/.test(sp)) {
          const inner = sp.replace(/^\*\*|\*\*$|^__|__$/g, '')
          runs.push(new TextRun({ text: inner, bold: true, font: FONT, size: SIZE_HALF }))
        } else if (sp) {
          runs.push(new TextRun({ text: sp, font: FONT, size: SIZE_HALF }))
        }
      }
    }
  }
  return runs.length ? runs : [new TextRun({ text, font: FONT, size: SIZE_HALF })]
}

// ── Processador de spans dentro de citação ───────────────────
// **termo** → negrito+itálico | (grifei) → negrito romano
// (STF/STJ...) ao final → normal (sem itálico)
// resto → itálico
function parseCitacaoRuns(text: string): TextRun[] {
  const runs: TextRun[] = []

  // Remove [ALERTA] dentro de citação
  const cleaned = text.replace(/\[ALERTA\](.*?)\[\/ALERTA\]/gi, '$1')

  // ── Detectar referência do acórdão ao final: "(STF, ..." ou "(STJ, ..."
  // Pode estar separada por espaço ou nova linha após (grifei)
  // Padrão: ... (grifei) (STJ, ...)  OU  ... (STF, ...)  sem (grifei)
  const refPattern = /(\s*\([A-Z]{2,4}[,\s].+\)\s*)$/
  const refMatch = cleaned.match(refPattern)

  // ── Detectar (grifei) antes da referência
  let workText = refMatch ? cleaned.slice(0, cleaned.length - refMatch[1].length) : cleaned
  const refText = refMatch ? refMatch[1] : ''

  const grifeiMatch = workText.match(/(\s*\(grifei\)\s*)$/i)
  const mainText  = grifeiMatch ? workText.slice(0, workText.length - grifeiMatch[1].length) : workText
  const grifeiText = grifeiMatch ? grifeiMatch[1] : ''

  // Processar **bold** no texto principal → negrito+itálico
  const parts = mainText.split(/(\*\*[^*]+\*\*)/g)
  for (const part of parts) {
    if (/^\*\*/.test(part)) {
      const inner = part.replace(/^\*\*|\*\*$/g, '')
      runs.push(new TextRun({ text: inner, bold: true, italics: true, font: FONT, size: SIZE_HALF }))
    } else if (part) {
      runs.push(new TextRun({ text: part, italics: true, font: FONT, size: SIZE_HALF }))
    }
  }

  // (grifei) → negrito romano
  if (grifeiText) {
    runs.push(new TextRun({ text: grifeiText, bold: true, font: FONT, size: SIZE_HALF }))
  }

  // Referência acórdão → normal (sem itálico, sem bold) — mesmo parágrafo
  if (refText) {
    runs.push(new TextRun({ text: refText, font: FONT, size: SIZE_HALF }))
  }

  return runs.length
    ? runs
    : [new TextRun({ text: cleaned, italics: true, font: FONT, size: SIZE_HALF })]
}

// ── Construtores de parágrafo ─────────────────────────────────

// Corpo: justificado · recuo 1ª linha 1,25cm · LS 1,5 · SpB=0 SpA=0 · 12pt
function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseAlerta(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_15, before: 0, after: 0 },
    indent: { firstLine: INDENT_FIRST },
  })
}

// Seção principal (DOS FATOS / DA CONSULTA):
// CAIXA ALTA · negrito · esquerda · SpBef=320twip(16pt) SpAft=120twip(6pt)
function sectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 320, after: 120 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Subseção (4.1. Subtítulo): negrito · esquerda · SpBef=0 SpA=0
function subsectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 0, after: 0 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Título principal (PARECER JURÍDICO): CAPS · negrito · centralizado
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_15, before: 200, after: 200 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Ementa: "EMENTA: texto" · recuo esq 3cm · IndFirst=0 · SpB=0 SpA=0
function ementaParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseAlerta(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_15, before: 0, after: 0 },
    indent: { left: INDENT_QUOTE, firstLine: 0 },
  })
}

// Cabeçalho bold (Processo nº, Autor:): negrito · esquerda
function boldLineParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 60, after: 60 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Corpo da citação: IndLeft=3cm · LS=simples · SpB=60 SpA=60 · 12pt
// A referência do acórdão vai DENTRO do mesmo parágrafo (não separado)
function quoteParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseCitacaoRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_1, before: 60, after: 60 },
    indent: { left: INDENT_QUOTE, firstLine: 0 },
  })
}

// Fecho/closing: esquerda · 12pt
function closingParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseAlerta(text),
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 60, after: 60 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Assinatura (MAURO MONCAO / Advogado / OAB):
// CENTER · bold · SpB=0 SpA=0 · LS=simples (1,0)
function signatureParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_1, before: 0, after: 0 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Linha vazia (usada apenas antes/após blocos de citação)
function emptyParagraph(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: '', font: FONT, size: SIZE_HALF })],
    spacing: { before: 0, after: 0, line: LINE_15 },
  })
}

// ── Carrega .docx do timbre como ArrayBuffer ──────────────────
async function loadTimbreDocx(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

// ── Injeta conteúdo no .docx do timbre (preserva cabeçalho) ──
// O timbre é um ARQUIVO WORD SEPARADO — o sistema extrai o header
// do timbre e injeta no documento gerado. Se falhar, gera sem timbre.
async function injectContentIntoTimbre(
  timbreBuffer: ArrayBuffer,
  contentParagraphs: Paragraph[],
  title: string,
  agentName: string,
): Promise<Blob> {
  try {
    const zip = new PizZip(timbreBuffer)

    // 1. Extrair todos os headers do timbre (header1, header2, header3)
    const headers: { name: string; xml: string; relsName: string; relsXml: string }[] = []
    for (const n of ['1', '2', '3']) {
      const hXml  = zip.file(`word/header${n}.xml`)?.asText() || ''
      const hRels = zip.file(`word/_rels/header${n}.xml.rels`)?.asText() || ''
      if (hXml) headers.push({ name: `header${n}`, xml: hXml, relsName: `header${n}.xml.rels`, relsXml: hRels })
    }
    const hasHeader = headers.length > 0

    // 2. Extrair todas as imagens do timbre (media/)
    const mediaFiles: { name: string; data: Uint8Array }[] = []
    const mediaKeys = Object.keys((zip as any).files || {}).filter(k => k.startsWith('word/media/'))
    for (const key of mediaKeys) {
      const f = zip.file(key)
      if (f) {
        const name = key.replace('word/media/', '')
        mediaFiles.push({ name, data: f.asUint8Array() })
      }
    }

    // 3. Construir o novo documento com conteúdo
    const newDoc = new Document({
      creator: `BEN Ecosystem IA — ${agentName}`,
      title,
      description: `Gerado por ${agentName} — Mauro Monção Advogados Associados`,
      styles: {
        default: {
          document: {
            run: { font: FONT, size: SIZE_HALF },
            paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE_15 } },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: {
              top:    convertMillimetersToTwip(35),
              bottom: M_BOTTOM,
              left:   M_LEFT,
              right:  M_RIGHT,
              header: convertMillimetersToTwip(12.5),
            },
          },
        },
        children: contentParagraphs,
      }],
    })

    const newBlob   = await Packer.toBlob(newDoc)
    const newBuffer = await newBlob.arrayBuffer()
    const newZip    = new PizZip(newBuffer)

    if (hasHeader) {
      // Copiar imagens
      for (const m of mediaFiles) {
        newZip.file(`word/media/${m.name}`, m.data)
      }

      // Copiar headers e seus rels
      for (const h of headers) {
        newZip.file(`word/${h.name}.xml`, h.xml)
        if (h.relsXml) newZip.file(`word/_rels/${h.relsName}`, h.relsXml)
      }

      // Atualizar document.xml.rels para incluir todos os headers
      const docRelsPath = 'word/_rels/document.xml.rels'
      let docRels = newZip.file(docRelsPath)?.asText() || ''
      const typeHdr = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/header'
      for (const h of headers) {
        const rid = `rId${h.name.charAt(0).toUpperCase()}${h.name.slice(1)}`
        if (!docRels.includes(`Target="${h.name}.xml"`)) {
          docRels = docRels.replace(
            '</Relationships>',
            `<Relationship Id="${rid}" Type="${typeHdr}" Target="${h.name}.xml"/>\n</Relationships>`
          )
        }
      }
      newZip.file(docRelsPath, docRels)

      // Atualizar document.xml para referenciar os headers
      let docXml = newZip.file('word/document.xml')?.asText() || ''
      if (docXml) {
        // Construir headerReference para cada header encontrado
        const hrefs = headers.map(h => {
          const rid = `rId${h.name.charAt(0).toUpperCase()}${h.name.slice(1)}`
          return `<w:headerReference w:type="default" r:id="${rid}"/>`
        }).join('')

        // Inserir antes do fechamento de sectPr
        if (!docXml.includes('headerReference')) {
          docXml = docXml.replace(/<w:sectPr>/, `<w:sectPr>${hrefs}`)
          newZip.file('word/document.xml', docXml)
        }
      }
    }

    const finalBuffer = newZip.generate({ type: 'arraybuffer' })
    return new Blob([finalBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  } catch (err) {
    console.error('[BEN] Erro ao injetar timbre:', err)
    return generateDocxBlob(contentParagraphs, title, agentName)
  }
}

// ── Gera blob do documento sem timbre ────────────────────────
async function generateDocxBlob(
  children: Paragraph[],
  title: string,
  agentName: string,
): Promise<Blob> {
  const doc = new Document({
    creator: `BEN Ecosystem IA — ${agentName}`,
    title,
    description: `Gerado por ${agentName} — Mauro Monção Advogados Associados`,
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_HALF },
          paragraph: { alignment: AlignmentType.JUSTIFIED, spacing: { line: LINE_15 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: M_TOP, bottom: M_BOTTOM, left: M_LEFT, right: M_RIGHT } },
      },
      children,
    }],
  })
  return Packer.toBlob(doc)
}

// ════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL EXPORTADA
// ════════════════════════════════════════════════════════════
export async function downloadDocx(
  content: string,
  title: string,
  agentName = 'BEN Agente Jurídico',
  timbreFile: File | null = null,
): Promise<void> {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  let inQuote             = false
  let consecutiveEmpty    = 0
  let lastTypeWasBody     = false  // controla supressão de linha vazia entre parágrafos de corpo
  let inSignatureBlock    = false

  for (const line of lines) {
    const { type, text } = classifyLine(line, inQuote)

    // ── Controle de citação ───────────────────────────────
    if (type === 'quote_start') {
      inQuote = true
      lastTypeWasBody = false
      // Uma linha vazia antes do bloco de citação
      children.push(emptyParagraph())
      continue
    }
    if (type === 'quote_end') {
      inQuote = false
      lastTypeWasBody = false
      // Uma linha vazia após o bloco de citação
      children.push(emptyParagraph())
      continue
    }

    // ── Linhas vazias ─────────────────────────────────────
    if (type === 'empty') {
      consecutiveEmpty++
      // REGRA: NÃO inserir linha vazia entre parágrafos de corpo
      // Só inserir linha vazia se não vier de corpo para corpo
      if (!lastTypeWasBody && consecutiveEmpty === 1) {
        children.push(emptyParagraph())
      }
      continue
    }

    consecutiveEmpty = 0

    // ── Construir parágrafo conforme tipo ─────────────────
    switch (type) {
      case 'title':
        children.push(titleParagraph(text))
        lastTypeWasBody = false
        inSignatureBlock = false
        break

      case 'section':
        children.push(sectionParagraph(text))
        lastTypeWasBody = false
        inSignatureBlock = false
        break

      case 'subsection':
        children.push(subsectionParagraph(text))
        lastTypeWasBody = false
        inSignatureBlock = false
        break

      case 'ementa':
        children.push(ementaParagraph(text))
        lastTypeWasBody = false
        break

      case 'bold_line':
        children.push(boldLineParagraph(text))
        lastTypeWasBody = false
        break

      case 'quote_body':
        children.push(quoteParagraph(text))
        lastTypeWasBody = false
        break

      case 'closing':
        children.push(closingParagraph(text))
        lastTypeWasBody = false
        break

      case 'signature':
        children.push(signatureParagraph(text))
        inSignatureBlock = true
        lastTypeWasBody = false
        break

      case 'body':
      default:
        children.push(bodyParagraph(text))
        lastTypeWasBody = true
        inSignatureBlock = false
        break
    }
  }

  // ── Gerar blob com ou sem timbre ─────────────────────────
  let blob: Blob
  if (timbreFile) {
    const timbreBuffer = await loadTimbreDocx(timbreFile)
    blob = await injectContentIntoTimbre(timbreBuffer, children, title, agentName)
  } else {
    blob = await generateDocxBlob(children, title, agentName)
  }

  const safe = title
    .replace(/[^a-z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ ]/gi, '_')
    .trim()
    .slice(0, 80)
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  saveAs(blob, `${safe}-${date}.docx`)
}
