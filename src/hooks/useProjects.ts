// ============================================================
// BEN Workspace — Hook de Projetos
// Gerencia estado e operações CRUD de projetos
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import workspaceAPI, { Project } from '../lib/workspaceAPI'

export function useProjects(filters?: { status?: string; area?: string }) {
  const [projects, setProjects]   = useState<Project[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await workspaceAPI.getProjects(filters)
      setProjects(r.projects)
      setTotal(r.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar projetos')
    } finally {
      setLoading(false)
    }
  }, [filters?.status, filters?.area])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (data: Partial<Project>) => {
    const r = await workspaceAPI.createProject(data)
    await fetchProjects()
    return r.project
  }

  const updateProject = async (id: string, data: Partial<Project>) => {
    const r = await workspaceAPI.updateProject(id, data)
    setProjects(prev => prev.map(p => p.id === id ? r.project : p))
    return r.project
  }

  const archiveProject = async (id: string) => {
    await workspaceAPI.deleteProject(id)
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'arquivado' as const } : p))
  }

  return { projects, total, loading, error, refetch: fetchProjects, createProject, updateProject, archiveProject }
}

export function useProject(id: string | null) {
  const [project, setProject]     = useState<Project | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [conversations, setConversations] = useState<unknown[]>([])
  const [documents, setDocuments]         = useState<unknown[]>([])
  const [tasks, setTasks]                 = useState<unknown[]>([])

  const fetchProject = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const r = await workspaceAPI.getProject(id)
      setProject(r.project)
      setConversations(r.conversas_recentes)
      setDocuments(r.documentos_recentes)
      setTasks(r.tarefas_pendentes)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar projeto')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchProject() }, [fetchProject])

  return { project, loading, error, conversations, documents, tasks, refetch: fetchProject }
}
