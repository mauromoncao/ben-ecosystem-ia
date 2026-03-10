import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { MaterialCommunityIcons } from '@expo/vector-icons'

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail]         = useState('')
  const [senha, setSenha]         = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      setError('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    setError('')
    const ok = await login(email.trim(), senha.trim())
    setLoading(false)
    if (!ok) {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.')
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          {/* Logo / ícone */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>⚖️</Text>
            </View>
          </View>

          <Text style={styles.brandName}>BEN ECOSYSTEM IA</Text>
          <Text style={styles.brandSub}>Workspace de Inteligência Artificial</Text>
          <Text style={styles.brandFirm}>Mauro Monção Advogados Associados</Text>
          <Text style={styles.brandCities}>Parnaíba · PI e Fortaleza · CE</Text>
        </View>

        {/* Card de login */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acesso ao Sistema</Text>
          <Text style={styles.cardSub}>Entre com suas credenciais do escritório</Text>

          {/* E-mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com.br"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="lock-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPassword]}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!showSenha}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowSenha(v => !v)} style={styles.eyeButton}>
                <MaterialCommunityIcons
                  name={showSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Erro */}
          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Botão entrar */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#0f2044" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="login" size={18} color="#0f2044" />
                <Text style={styles.loginButtonText}>Entrar no Workspace</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Agentes disponíveis */}
        <View style={styles.agentsInfo}>
          <View style={styles.agentsBadge}>
            <Text style={styles.agentsCount}>35</Text>
            <Text style={styles.agentsLabel}>agentes de IA</Text>
          </View>
          <View style={styles.agentsBadge}>
            <Text style={styles.agentsCount}>2</Text>
            <Text style={styles.agentsLabel}>centros integrados</Text>
          </View>
          <View style={styles.agentsBadge}>
            <Text style={styles.agentsCount}>8h</Text>
            <Text style={styles.agentsLabel}>sessão ativa</Text>
          </View>
        </View>

        {/* Rodapé */}
        <Text style={styles.footer}>
          © 2026 Mauro Monção Advogados Associados{'\n'}
          falcone · BEN Ecosystem IA v1.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f2044',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 36,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 2,
    borderColor: '#D4A017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 38,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4A017',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  brandFirm: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  brandCities: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f2044',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  inputPassword: {
    flex: 1,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#dc2626',
    lineHeight: 18,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D4A017',
    borderRadius: 14,
    height: 52,
    marginTop: 8,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2044',
  },
  agentsInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  agentsBadge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  agentsCount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#D4A017',
  },
  agentsLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
})
