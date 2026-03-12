// ============================================================
// BEN ECOSYSTEM IA — Gerador de .docx Profissional v4.0
// Escritório Mauro Monção Advogados Associados
//
// PADRÃO CANÔNICO INEGOCIÁVEL:
//  - Fonte: Palatino Linotype 12pt em TODO o documento
//  - Alinhamento: justificado (corpo), esquerda (títulos/seções),
//                 centralizado (título principal do documento)
//  - Espaçamento entre linhas: 1,5 (corpo) | simples (citações)
//  - Recuo 1ª linha parágrafo corpo: 1,25 cm
//  - Margens: sup 3cm | inf 2cm | esq 3cm | dir 2cm
//  - Títulos: CAIXA ALTA · negrito · centralizado · sem recuo
//  - Seções:  1. DOS FATOS → CAIXA ALTA · negrito · esquerda · sem recuo
//  - Subseções: 1.1. Subtítulo → negrito · esquerda · sem recuo
//  - Citações [CITAÇÃO]...[/CITAÇÃO]:
//      · recuo 3cm esq · simples · sem 1ª linha · 12pt
//      · texto normal → itálico
//      · **termo** → negrito+itálico  (destaque persuasivo)
//      · (grifei) → negrito romano
//  - [ALERTA]termo[/ALERTA] no corpo → negrito 12pt
//  - Linha de identificação após [/CITAÇÃO] → normal 12pt, recuo extra
//  - NUNCA: #, ##, **, __, ---, >, `
// ============================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  convertMillimetersToTwip,
  Header,
} from 'docx'
import { saveAs } from 'file-saver'
import PizZip from 'pizzip'

// ── Constantes de formatação ─────────────────────────────────
const FONT      = 'Palatino Linotype'
const SIZE_PT   = 12
const SIZE_HALF = SIZE_PT * 2   // half-points (unidade do docx)

// Espaçamentos em twips (1pt = 20twips)
const LINE_15   = 360   // 1.5× espaçamento (240 × 1.5)
const LINE_1    = 240   // simples

// Margens em mm → twips
const M_TOP    = convertMillimetersToTwip(30)
const M_BOTTOM = convertMillimetersToTwip(20)
const M_LEFT   = convertMillimetersToTwip(30)
const M_RIGHT  = convertMillimetersToTwip(20)

// Recuos
const INDENT_FIRST = convertMillimetersToTwip(12.5) // 1,25cm — 1ª linha corpo
const INDENT_QUOTE = convertMillimetersToTwip(30)   // 3cm — bloco citação
const INDENT_REF   = convertMillimetersToTwip(35)   // 3,5cm — identificação acórdão

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
  | 'section'      // 1. DOS FATOS / — DOS FATOS / I. DOS FATOS — CAPS · negrito · esquerda
  | 'subsection'   // 1.1. Subtítulo — negrito · esquerda
  | 'bold_line'    // Processo nº / Autor: — negrito · esquerda
  | 'quote_start'  // [CITAÇÃO]
  | 'quote_end'    // [/CITAÇÃO]
  | 'quote_body'   // linha dentro de bloco de citação
  | 'quote_ref'    // linha de identificação após [/CITAÇÃO]: (STJ, HC 123…)
  | 'closing'      // NESTES TERMOS / LOCAL, DATA / assinatura
  | 'body'         // parágrafo normal

function classifyLine(raw: string, inQuote: boolean, afterQuoteEnd: boolean): { type: LineType; text: string } {
  const clean = stripMarkdownLight(raw)

  if (!clean) return { type: 'empty', text: '' }
  if (/^[-=_]{3,}$/.test(clean)) return { type: 'empty', text: '' }

  // Marcadores de citação
  if (/^\[CITAÇÃO\]$/i.test(clean))  return { type: 'quote_start', text: '' }
  if (/^\[\/CITAÇÃO\]$/i.test(clean)) return { type: 'quote_end',  text: '' }

  // Dentro de citação
  if (inQuote) return { type: 'quote_body', text: clean }

  // Linha de identificação do acórdão (logo após [/CITAÇÃO])
  if (afterQuoteEnd && /^\(/.test(clean.trim())) {
    return { type: 'quote_ref', text: clean }
  }

  // Fecho / assinatura
  if (/^(NESTES TERMOS|PEDE DEFERIMENTO|TERMOS EM QUE|Nestes termos|Pede deferimento|Respeitosamente|Atenciosamente)/i.test(clean))
    return { type: 'closing', text: clean }

  const isAllCaps = clean === clean.toUpperCase() && /[A-ZÁÉÍÓÚÃÕÂÊÎÔÛÇ]/.test(clean)
  const wordCount = clean.trim().split(/\s+/).length

  // Seção com travessão
  if (/^[—–-]\s*[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/.test(clean))
    return { type: 'section', text: clean }

  // Seção numérica: 1. TÍTULO (CAPS obrigatório)
  if (/^\d{1,2}\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // Seção romana: I. TÍTULO (CAPS)
  if (/^(I{1,3}V?|IV|VI{0,3}|IX|X{1,3})\.\s+[A-ZÁÉÍÓÚ]/.test(clean) && isAllCaps)
    return { type: 'section', text: clean }

  // Subseção numerada: 1.1. / 1.2. / 2.3.
  if (/^\d{1,2}\.\d{1,2}\.?\s+[A-ZÁÉÍÓÚa-záéíóú]/.test(clean))
    return { type: 'subsection', text: clean }

  // Título principal: CAPS curto (≤10 palavras), sem ponto final
  if (isAllCaps && wordCount <= 10 && !clean.endsWith('.') && wordCount >= 1)
    return { type: 'title', text: clean }

  // Linha cabeçalho bold
  if (
    wordCount <= 12 &&
    /^(Processo|Autos|Ação|Autor|Réu|Requerente|Requerido|Apelante|Apelado|Consulente|Impugnante|Impugnado|Embargante|Embargado|Exequente|Executado|Paciente|Impetrante|Recorrente|Recorrido|Agravante|Agravado|Cliente|Espólio|Inventariante|Data|Assunto|Ref\.|Referência|OAB|CNPJ|CPF)\s*[:\-]/i.test(clean)
  )
    return { type: 'bold_line', text: clean }

  return { type: 'body', text: clean }
}

// ── Processador de [ALERTA] no corpo ─────────────────────────
// [ALERTA]termo[/ALERTA] → negrito 12pt
function parseAlerta(text: string): TextRun[] {
  const runs: TextRun[] = []
  const parts = text.split(/(\[ALERTA\].*?\[\/ALERTA\])/gi)
  for (const part of parts) {
    const match = part.match(/^\[ALERTA\](.*?)\[\/ALERTA\]$/i)
    if (match) {
      runs.push(new TextRun({ text: match[1], bold: true, font: FONT, size: SIZE_HALF }))
    } else if (part) {
      // dentro do corpo, processar **bold** inline também
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
// **termo** → negrito+itálico | (grifei) → negrito normal | resto → itálico
function parseCitacaoRuns(text: string): TextRun[] {
  const runs: TextRun[] = []

  // Remove [ALERTA] dentro de citação (não usado lá)
  const cleaned = text.replace(/\[ALERTA\](.*?)\[\/ALERTA\]/gi, '$1')

  // Detectar (grifei) separado
  const grifeiMatch = cleaned.match(/(\s*\(grifei\)\s*)$/i)
  const mainText = grifeiMatch ? cleaned.slice(0, cleaned.length - grifeiMatch[1].length) : cleaned
  const grifeiText = grifeiMatch ? grifeiMatch[1] : ''

  // Processar **bold** no texto principal
  const parts = mainText.split(/(\*\*[^*]+\*\*)/g)
  for (const part of parts) {
    if (/^\*\*/.test(part)) {
      const inner = part.replace(/^\*\*|\*\*$/g, '')
      // Negrito + Itálico — destaque persuasivo (padrão STF/STJ)
      runs.push(new TextRun({ text: inner, bold: true, italics: true, font: FONT, size: SIZE_HALF }))
    } else if (part) {
      // Texto normal da citação → itálico simples
      runs.push(new TextRun({ text: part, italics: true, font: FONT, size: SIZE_HALF }))
    }
  }

  // (grifei) → negrito romano
  if (grifeiText) {
    runs.push(new TextRun({ text: grifeiText, bold: true, font: FONT, size: SIZE_HALF }))
  }

  return runs.length ? runs : [new TextRun({ text: cleaned, italics: true, font: FONT, size: SIZE_HALF })]
}

// ── Construtores de parágrafo ─────────────────────────────────

// Corpo: justificado · recuo 1,25cm · 1,5 · 12pt
function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseAlerta(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_15, before: 0, after: 0 },
    indent: { firstLine: INDENT_FIRST },
  })
}

// Seção principal (1. DOS FATOS): CAPS · negrito · esquerda · 12pt
function sectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 320, after: 120 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Subseção (1.1. Subtítulo): negrito · esquerda · 12pt
function subsectionParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 200, after: 80 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Título principal: CAPS · negrito · centralizado · 12pt
function titleParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_15, before: 200, after: 200 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Cabeçalho bold (Processo nº, Autor:): negrito · esquerda · 12pt
function boldLineParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_15, before: 60, after: 60 },
    indent: { firstLine: 0, left: 0 },
  })
}

// Corpo da citação: recuo 3cm · simples · 12pt
// texto normal → itálico | **termo** → negrito+itálico
function quoteParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseCitacaoRuns(text),
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_1, before: 60, after: 60 },
    indent: { left: INDENT_QUOTE, firstLine: 0 },
  })
}

// Identificação do acórdão após citação: normal · 12pt · recuo extra
function quoteRefParagraph(text: string): Paragraph {
  // Colocar nomes próprios em maiúsculas (Rel. Min. FULANO)
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: SIZE_HALF })],
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_1, before: 40, after: 120 },
    indent: { left: INDENT_REF, firstLine: 0 },
  })
}

// Fecho/assinatura: esquerda · 12pt
function closingParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseAlerta(text),
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
async function injectContentIntoTimbre(
  timbreBuffer: ArrayBuffer,
  contentParagraphs: Paragraph[],
  title: string,
  agentName: string,
): Promise<Blob> {
  try {
    // Carregar o .docx do timbre como zip
    const zip = new PizZip(timbreBuffer)

    // Criar um novo documento com as margens do timbre mas com o conteúdo gerado
    // Estratégia: usar docx library para criar documento limpo e depois
    // copiar o header do timbre para o novo documento via manipulação zip

    // 1. Extrair header XML do timbre
    const headerXml = zip.file('word/header1.xml')?.asText() || ''
    const headerRels = zip.file('word/_rels/header1.xml.rels')?.asText() || ''
    const hasHeader = headerXml.length > 0

    // 2. Extrair imagem do timbre se existir
    let timbreImageData: ArrayBuffer | null = null
    let timbreImageName = ''
    if (hasHeader && headerRels) {
      const imgMatch = headerRels.match(/Target="media\/([^"]+)"/)
      if (imgMatch) {
        timbreImageName = imgMatch[1]
        const imgFile = zip.file(`word/media/${timbreImageName}`)
        if (imgFile) {
          timbreImageData = imgFile.asArrayBuffer()
        }
      }
    }

    // 3. Construir o novo documento com conteúdo
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
              top:    convertMillimetersToTwip(35), // 3,5cm para dar espaço ao timbre
              bottom: M_BOTTOM,
              left:   M_LEFT,
              right:  M_RIGHT,
              header: convertMillimetersToTwip(12.5),
            },
          },
        },
        children: contentParagraphs,
      }],
    }

    const newDoc = new Document(docConfig)
    const newBlob = await Packer.toBlob(newDoc)
    const newBuffer = await newBlob.arrayBuffer()

    // 4. Abrir novo documento como zip e injetar o header do timbre
    const newZip = new PizZip(newBuffer)

    if (hasHeader && timbreImageData) {
      // Copiar imagem do timbre
      newZip.file(`word/media/${timbreImageName}`, timbreImageData)

      // Copiar header XML
      newZip.file('word/header1.xml', headerXml)

      // Copiar rels do header
      newZip.file('word/_rels/header1.xml.rels', headerRels)

      // Atualizar _rels do document para referenciar o header
      const docRelsPath = 'word/_rels/document.xml.rels'
      let docRels = newZip.file(docRelsPath)?.asText() || ''

      if (!docRels.includes('header1.xml')) {
        docRels = docRels.replace(
          '</Relationships>',
          `<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`
        )
        newZip.file(docRelsPath, docRels)
      }

      // Atualizar document.xml para usar o header
      let docXml = newZip.file('word/document.xml')?.asText() || ''
      if (docXml && !docXml.includes('headerReference')) {
        docXml = docXml.replace(
          /<w:sectPr>/,
          `<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader1"/>`
        )
        newZip.file('word/document.xml', docXml)
      }
    }

    // 5. Gerar blob final
    const finalBuffer = newZip.generate({ type: 'arraybuffer' })
    return new Blob([finalBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  } catch (err) {
    console.error('[BEN] Erro ao injetar timbre:', err)
    // Fallback: gerar documento sem timbre
    return generateDocxBlob(contentParagraphs, title, agentName, false)
  }
}

// ── Gera blob do documento sem timbre ────────────────────────
async function generateDocxBlob(
  children: Paragraph[],
  title: string,
  agentName: string,
  _withTimbre: boolean,
): Promise<Blob> {
  const doc = new Document({
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
          margin: { top: M_TOP, bottom: M_BOTTOM, left: M_LEFT, right: M_RIGHT },
        },
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

  let consecutiveEmpty = 0
  let inQuote = false
  let justEndedQuote = false

  for (const line of lines) {
    const { type, text } = classifyLine(line, inQuote, justEndedQuote)

    // Resetar flag de pós-citação após usar
    if (justEndedQuote && type !== 'quote_ref') {
      justEndedQuote = false
    }

    if (type === 'quote_start') {
      inQuote = true
      justEndedQuote = false
      children.push(emptyParagraph())
      continue
    }
    if (type === 'quote_end') {
      inQuote = false
      justEndedQuote = true
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
      case 'quote_ref':
        children.push(quoteRefParagraph(text))
        justEndedQuote = false
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

  // ── Gerar blob com ou sem timbre ─────────────────────────
  let blob: Blob
  if (timbreFile) {
    const timbreBuffer = await loadTimbreDocx(timbreFile)
    blob = await injectContentIntoTimbre(timbreBuffer, children, title, agentName)
  } else {
    blob = await generateDocxBlob(children, title, agentName, false)
  }

  const safe = title
    .replace(/[^a-z0-9áéíóúãõâêîôûçÁÉÍÓÚÃÕÂÊÎÔÛÇ ]/gi, '_')
    .trim()
    .slice(0, 80)
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
  saveAs(blob, `${safe}-${date}.docx`)
}
