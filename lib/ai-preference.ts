export type AIAppId = 'chatgpt' | 'claude' | 'copilot'

export interface AIApp {
  id: AIAppId
  name: string
  url: string
}

export const AI_APPS: AIApp[] = [
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/' },
  { id: 'claude', name: 'Claude', url: 'https://claude.ai/new' },
  { id: 'copilot', name: 'Copilot', url: 'https://copilot.microsoft.com/' },
]

const STORAGE_KEY = 'fitlog-ai-app'
const DEFAULT_APP: AIAppId = 'chatgpt'

export function getSavedAIApp(): AIAppId {
  if (typeof window === 'undefined') return DEFAULT_APP
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && AI_APPS.some(a => a.id === saved)) return saved as AIAppId
  return DEFAULT_APP
}

export function saveAIApp(id: AIAppId) {
  localStorage.setItem(STORAGE_KEY, id)
}

export function getAIApp(id: AIAppId): AIApp {
  return AI_APPS.find(a => a.id === id) ?? AI_APPS[0]
}
