import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
  Share, Keyboard, Dimensions, StatusBar,
} from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as Clipboard from 'expo-clipboard'
import * as Sharing from 'expo-sharing'
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy'
import { useAuth, useIsAdmin } from '../context/AuthContext'
import { ECOSYSTEM_AGENTS, RESTRICTED_AGENTS } from '../lib/agents'
import { sendAgentMessage, buildHistoryFromMessages } from '../lib/api'
import { loadConversations, saveConversations } from '../lib/storage'
import { Message, Conversation, RootStackParamList, Agent } from '../types'

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>

const { width } = Dimensions.get('window')

// ── Renderiza linha de markdown básico ──────────────────────────────────────
function MessageLine({ line }: { line: string }) {
  if (line.startsWith('### ')) return <Text style={styles.h3}>{line.slice(4)}</Text>
  if (line.startsWith('## '))  return <Text style={styles.h2}>{line.slice(3)}</Text>
  if (line.startsWith('# '))   return <Text style={styles.h1}>{line.slice(2)}</Text>
  if (line.startsWith('---'))  return <View style={styles.hr} />
  if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
    return (
      <View style={styles.listItem}>
        <Text style={styles.listBullet}>•</Text>
        <Text style={styles.listText}>{line.slice(2)}</Text>
      </View>
    )
  }
  if (/^\d+\.\s/.test(line)) {
    return <Text style={styles.listText}>{line}</Text>
  }
  // Bold inline
  const parts = line.split(/(\*\*[^*]+\*\*)/)
  if (parts.length > 1) {
    return (
      <Text style={line === '' ? styles.emptyLine : styles.paragraph}>
        {parts.map((p, i) =>
          p.startsWith('**') && p.endsWith('**')
            ? <Text key={i} style={styles.bold}>{p.slice(2, -2)}</Text>
            : p
        )}
      </Text>
    )
  }
  return <Text style={line === '' ? styles.emptyLine : styles.paragraph}>{line}</Text>
}

// ── Bolha de mensagem ────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  agent,
  onCopy,
  copied,
}: {
  msg: Message
  agent: Agent | null
  onCopy: (content: string, msgId: string) => void
  copied: string | null
}) {
  const isUser = msg.role === 'user'

  if (msg.isLoading) {
    return (
      <View style={[styles.bubbleRow, styles.bubbleRowLeft]}>
        <View style={[styles.avatar, { backgroundColor: (agent?.color || '#888') + '25' }]}>
          <Text style={styles.avatarText}>{agent?.emoji || '🤖'}</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleAssistant, styles.bubbleLoading]}>
          <ActivityIndicator size="small" color={agent?.color || '#0f2044'} style={{ marginRight: 8 }} />
          <Text style={styles.loadingText}>Processando…</Text>
          <Text style={styles.destinoText}>
            → {agent?.project === 'growth' ? 'Growth' : 'Juris'} Center
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowRight : styles.bubbleRowLeft]}>
      {!isUser && (
        <View style={[styles.avatar, { backgroundColor: (agent?.color || '#888') + '25' }]}>
          <Text style={styles.avatarText}>{agent?.emoji || '🤖'}</Text>
        </View>
      )}

      <View style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
        { maxWidth: width * 0.78 }
      ]}>
        {isUser ? (
          <>
            <Text style={styles.userText}>{msg.content}</Text>
            {msg.attachments && msg.attachments.length > 0 && (
              <View style={styles.attachmentList}>
                {msg.attachments.map(a => (
                  <Text key={a.id} style={styles.attachmentItem}>
                    📎 {a.name.slice(0, 22)}
                  </Text>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View>
              {msg.content.split('\n').map((line, i) => (
                <MessageLine key={i} line={line} />
              ))}
            </View>
            {/* Meta info */}
            <View style={styles.msgMeta}>
              <Text style={styles.msgTime}>
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {msg.modelUsed ? (
                <View style={styles.modelBadge}>
                  <Text style={styles.modelBadgeText}>{msg.modelUsed}</Text>
                </View>
              ) : null}
              {msg.destino ? (
                <View style={[styles.destinoBadge,
                  msg.destino === 'growth' ? styles.destinoGrowth : styles.destinoJuris
                ]}>
                  <Text style={[styles.destinoBadgeText,
                    msg.destino === 'growth' ? styles.destinoGrowthText : styles.destinoJurisText
                  ]}>
                    {msg.destino === 'growth' ? '⚡ Growth' : '⚖️ Juris'}
                  </Text>
                </View>
              ) : null}
              {msg.elapsed_ms && msg.elapsed_ms > 0 ? (
                <Text style={styles.elapsed}>⚡ {(msg.elapsed_ms / 1000).toFixed(1)}s</Text>
              ) : null}
              <TouchableOpacity
                onPress={() => onCopy(msg.content, msg.id)}
                style={styles.copyBtn}
              >
                <MaterialCommunityIcons
                  name={copied === msg.id ? 'check' : 'content-copy'}
                  size={14}
                  color={copied === msg.id ? '#22c55e' : '#9ca3af'}
                />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TELA DE CHAT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ChatScreen() {
  const route      = useRoute<ChatRouteProp>()
  const navigation = useNavigation<NavProp>()
  const { user }   = useAuth()
  const isAdmin    = useIsAdmin(user?.email)

  const { agentId, conversationId } = route.params
  const agent = ECOSYSTEM_AGENTS.find(a => a.id === agentId) || null

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId]   = useState<string | null>(conversationId || null)
  const [prompt, setPrompt]               = useState('')
  const [isLoading, setIsLoading]         = useState(false)
  const [copiedMsgId, setCopiedMsgId]     = useState<string | null>(null)
  const [useSearch, setUseSearch]         = useState(false)
  const [letterheadMode, setLetterheadMode] = useState(false)
  const [showOptions, setShowOptions]     = useState(false)

  const flatListRef = useRef<FlatList>(null)

  const activeConv = conversations.find(c => c.id === activeConvId)
  const messages = activeConv?.messages || []

  // Carregar conversas
  useEffect(() => {
    const init = async () => {
      const convs = await loadConversations()
      setConversations(convs)

      // Abrir conversa existente ou criar nova
      if (conversationId) {
        const exists = convs.find(c => c.id === conversationId)
        if (exists) {
          setActiveConvId(conversationId)
          return
        }
      }
      // Reutilizar conversa vazia existente deste agente
      const existingEmpty = convs.find(c => c.agentId === agentId && c.messages.length === 0)
      if (existingEmpty) {
        setActiveConvId(existingEmpty.id)
        return
      }
      // Criar nova conversa
      const newId = `conv-${Date.now()}`
      const newConv: Conversation = {
        id: newId,
        title: `${agent?.emoji || ''} ${agent?.name || agentId}`,
        agentId,
        agentName: agent?.name || agentId,
        agentEmoji: agent?.emoji || '🤖',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: agent?.project || 'juris',
        starred: false,
        tags: [],
      }
      const updated = [newConv, ...convs]
      setConversations(updated)
      setActiveConvId(newId)
      await saveConversations(updated)
    }
    init()
  }, [agentId, conversationId])

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length])

  // Salvar ao atualizar conversas
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations)
    }
  }, [conversations])

  // ── Copiar mensagem ───────────────────────────────────────────────────────
  const copyMessage = useCallback(async (content: string, msgId: string) => {
    await Clipboard.setStringAsync(content)
    setCopiedMsgId(msgId)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }, [])

  // ── Enviar mensagem ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = prompt.trim()
    if (!text || !agent || !activeConvId || isLoading) return
    Keyboard.dismiss()

    const fullPrompt = text +
      (letterheadMode ? '\n\n[INSTRUÇÃO: Usar timbre oficial — Mauro Monção Advogados, Parnaíba-PI e Fortaleza-CE, OAB/PI.]' : '')

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    const loadingMsg: Message = {
      id: `msg-loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      agentId: agent.id,
      agentName: `${agent.emoji} ${agent.name}`,
      timestamp: new Date().toISOString(),
      isLoading: true,
    }

    let currentConvs: Conversation[] = []
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [...c.messages, userMsg, loadingMsg],
              updatedAt: new Date().toISOString(),
              title: c.messages.length === 0
                ? text.slice(0, 50) + (text.length > 50 ? '…' : '')
                : c.title,
            }
          : c
      )
      currentConvs = updated
      return updated
    })
    setPrompt('')
    setIsLoading(true)

    // Retry logic
    let attempts = 0
    while (attempts < 2) {
      attempts++
      try {
        const conv    = currentConvs.find(c => c.id === activeConvId)
        const history = buildHistoryFromMessages(
          (conv?.messages || []).filter(m => !m.isLoading)
        )

        const result = await sendAgentMessage({
          agentId: agent.id,
          input: fullPrompt,
          history,
          useSearch: useSearch || agent.id === 'ben-pesquisador-juridico',
          letterhead: letterheadMode,
        })

        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                updatedAt: new Date().toISOString(),
                messages: c.messages.filter(m => !m.isLoading).concat({
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: result.output,
                  agentId: agent.id,
                  agentName: `${agent.emoji} ${agent.name}`,
                  timestamp: new Date().toISOString(),
                  modelUsed: result.modelUsed,
                  destino: result.destino,
                  elapsed_ms: result.elapsed_ms,
                }),
              }
            : c
        ))
        break

      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Erro desconhecido'
        if (attempts < 2) {
          await new Promise(r => setTimeout(r, 1500))
          continue
        }
        setConversations(prev => prev.map(c =>
          c.id === activeConvId
            ? {
                ...c,
                messages: c.messages.filter(m => !m.isLoading).concat({
                  id: `msg-err-${Date.now()}`,
                  role: 'assistant',
                  content: `⚠️ Não foi possível conectar ao agente **${agent.name}** após ${attempts} tentativa(s).\n\nErro: ${errMsg}\n\n💡 Verifique sua conexão e o status dos sistemas.`,
                  agentId: agent.id,
                  agentName: `${agent.emoji} ${agent.name}`,
                  timestamp: new Date().toISOString(),
                }),
              }
            : c
        ))
      }
    }
    setIsLoading(false)
  }, [prompt, agent, activeConvId, isLoading, useSearch, letterheadMode])

  // ── Nova conversa ─────────────────────────────────────────────────────────
  const newConversation = useCallback(async () => {
    if (!agent) return
    const newId = `conv-${Date.now()}`
    const newConv: Conversation = {
      id: newId,
      title: `${agent.emoji} ${agent.name}`,
      agentId: agent.id,
      agentName: agent.name,
      agentEmoji: agent.emoji,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      project: agent.project,
      starred: false,
      tags: [],
    }
    const updated = [newConv, ...conversations]
    setConversations(updated)
    setActiveConvId(newId)
    setPrompt('')
    await saveConversations(updated)
  }, [agent, conversations])

  const exportTXT = useCallback(async () => {
    if (!activeConv) return
    const lines = [
      `BEN ECOSYSTEM IA — Conversa Exportada`,
      `Agente: ${activeConv.agentEmoji} ${activeConv.agentName}`,
      `Data: ${new Date(activeConv.createdAt).toLocaleString('pt-BR')}`,
      `Exportado em: ${new Date().toLocaleString('pt-BR')}`,
      `═══════════════════════════════════════`,
      '',
      ...activeConv.messages.filter(m => !m.isLoading).map(m => [
        `[${m.role === 'user' ? 'DR. MAURO MONÇÃO' : activeConv.agentName.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString('pt-BR')}`,
        m.content,
        '',
      ]).flat(),
      '═══════════════════════════════════════',
      'Gerado por BEN ECOSYSTEM IA · Mauro Monção Advogados Associados',
    ]
    const content = lines.join('\n')

    try {
      const filename = `ben-${activeConv.agentId}-${new Date(activeConv.createdAt).toISOString().slice(0, 10)}.txt`
      const fileUri = (documentDirectory || '') + filename
      await writeAsStringAsync(fileUri, content, { encoding: EncodingType.UTF8 })
      await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: 'Exportar conversa' })
    } catch {
      // fallback: Share como texto
      await Share.share({ message: content, title: `BEN — ${activeConv.agentName}` })
    }
  }, [activeConv])

  // ── Copiar toda a conversa ─────────────────────────────────────────────────
  const copyAll = useCallback(async () => {
    if (!activeConv) return
    const text = activeConv.messages
      .filter(m => !m.isLoading)
      .map(m => `[${m.role === 'user' ? 'VOCÊ' : activeConv.agentName}]\n${m.content}`)
      .join('\n\n---\n\n')
    await Clipboard.setStringAsync(text)
    Alert.alert('✅ Copiado', 'Toda a conversa foi copiada para a área de transferência.')
  }, [activeConv])

  if (!agent) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Agente não encontrado: {agentId}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f2044" />

      {/* ── HEADER ────────────────────────────────────────── */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>

        <View style={[styles.agentHeaderIcon, { backgroundColor: agent.color + '25' }]}>
          <Text style={styles.agentHeaderEmoji}>{agent.emoji}</Text>
        </View>

        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName} numberOfLines={1}>{agent.name}</Text>
          <Text style={styles.chatHeaderModel}>{agent.model}</Text>
        </View>

        <TouchableOpacity onPress={() => setShowOptions(v => !v)} style={styles.optionsBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── MENU OPÇÕES ───────────────────────────────────── */}
      {showOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity style={styles.optionItem} onPress={() => { newConversation(); setShowOptions(false) }}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#0f2044" />
            <Text style={styles.optionText}>Nova conversa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={() => { exportTXT(); setShowOptions(false) }}>
            <MaterialCommunityIcons name="export-variant" size={18} color="#0f2044" />
            <Text style={styles.optionText}>Exportar TXT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionItem} onPress={() => { copyAll(); setShowOptions(false) }}>
            <MaterialCommunityIcons name="content-copy" size={18} color="#0f2044" />
            <Text style={styles.optionText}>Copiar conversa</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── ÁREA DE MENSAGENS ─────────────────────────────── */}
      {messages.length === 0 ? (
        <View style={styles.emptyChat}>
          <View style={[styles.emptyChatIcon, { backgroundColor: agent.color + '20' }]}>
            <Text style={styles.emptyChatEmoji}>{agent.emoji}</Text>
          </View>
          <Text style={styles.emptyChatName}>{agent.name}</Text>
          <Text style={styles.emptyChatDesc}>{agent.description}</Text>
          <View style={[styles.emptyChatBadge, { backgroundColor: agent.color + '15', borderColor: agent.color + '40' }]}>
            <Text style={[styles.emptyChatBadgeText, { color: agent.color }]}>
              {agent.project === 'growth' ? '⚡ Growth Center' : '⚖️ Juris Center'}
            </Text>
          </View>
          <Text style={styles.emptyChatHint}>
            Digite sua mensagem abaixo para começar
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              agent={agent}
              onCopy={copyMessage}
              copied={copiedMsgId}
            />
          )}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* ── BARRA DE INPUT ────────────────────────────────── */}
      <View style={styles.inputArea}>
        {/* Toggle Web e Timbre */}
        <View style={styles.inputToggles}>
          <TouchableOpacity
            onPress={() => setUseSearch(v => !v)}
            style={[styles.toggleChip, useSearch && styles.toggleChipActive]}
          >
            <MaterialCommunityIcons name="web" size={13} color={useSearch ? '#7c3aed' : '#9ca3af'} />
            <Text style={[styles.toggleChipText, useSearch && styles.toggleChipTextActive]}>Web</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLetterheadMode(v => !v)}
            style={[styles.toggleChip, letterheadMode && styles.toggleChipTimbre]}
          >
            <MaterialCommunityIcons name="office-building" size={13} color={letterheadMode ? '#ffffff' : '#9ca3af'} />
            <Text style={[styles.toggleChipText, letterheadMode && styles.toggleChipTextActive]}>Timbre</Text>
          </TouchableOpacity>
          {messages.filter(m => !m.isLoading).length > 0 && (
            <TouchableOpacity
              onPress={newConversation}
              style={styles.toggleChip}
            >
              <MaterialCommunityIcons name="plus" size={13} color="#9ca3af" />
              <Text style={styles.toggleChipText}>Nova</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Linha de digitação */}
        <View style={[styles.inputRow, { borderColor: agent.color + '60' }]}>
          <TextInput
            style={styles.textInput}
            placeholder={`Mensagem para ${agent.emoji} ${agent.name}… (Enter para enviar)`}
            placeholderTextColor="#9ca3af"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            returnKeyType="default"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={isLoading || !prompt.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: isLoading || !prompt.trim() ? '#e5e7eb' : '#D4A017' }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#0f2044" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color={prompt.trim() ? '#0f2044' : '#9ca3af'} />
            )}
          </TouchableOpacity>
        </View>
        <Text style={styles.inputHint}>Shift+Enter nova linha · retry automático em falha</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  chatHeader: {
    backgroundColor: '#0f2044',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  agentHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentHeaderEmoji: {
    fontSize: 18,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  chatHeaderModel: {
    fontSize: 10,
    color: '#6b7aaa',
    marginTop: 1,
  },
  optionsBtn: {
    padding: 4,
  },
  optionsMenu: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 16,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#0f2044',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bubbleLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 21,
  },
  loadingText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  destinoText: {
    fontSize: 10,
    color: '#d1d5db',
    marginLeft: 4,
  },
  // Markdown styles
  h1: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 4 },
  h2: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 6, marginBottom: 3 },
  h3: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 4, marginBottom: 2 },
  hr: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 2 },
  listBullet: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  listText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  paragraph: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 1 },
  emptyLine: { height: 6 },
  bold: { fontWeight: '700', color: '#111827' },
  // Meta info
  msgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 6,
    flexWrap: 'wrap',
  },
  msgTime: { fontSize: 10, color: '#9ca3af' },
  modelBadge: { backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  modelBadgeText: { fontSize: 9, color: '#6b7280' },
  destinoBadge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  destinoGrowth: { backgroundColor: '#dcfce7' },
  destinoJuris: { backgroundColor: '#dbeafe' },
  destinoBadgeText: { fontSize: 9, fontWeight: '700' },
  destinoGrowthText: { color: '#15803d' },
  destinoJurisText: { color: '#1d4ed8' },
  elapsed: { fontSize: 10, color: '#9ca3af' },
  copyBtn: { marginLeft: 'auto' as any, padding: 2 },
  attachmentList: { marginTop: 6, gap: 2 },
  attachmentItem: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  // Empty chat
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyChatIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyChatEmoji: { fontSize: 36 },
  emptyChatName: { fontSize: 18, fontWeight: '800', color: '#0f2044', textAlign: 'center', marginBottom: 8 },
  emptyChatDesc: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 19, marginBottom: 12 },
  emptyChatBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  emptyChatBadgeText: { fontSize: 12, fontWeight: '600' },
  emptyChatHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },
  // Input area
  inputArea: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputToggles: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleChipActive: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  toggleChipTimbre: {
    backgroundColor: '#0f2044',
    borderColor: '#0f2044',
  },
  toggleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleChipTextActive: {
    color: '#7c3aed',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    maxHeight: 120,
    lineHeight: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputHint: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 4,
  },
  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0f2044',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
})
