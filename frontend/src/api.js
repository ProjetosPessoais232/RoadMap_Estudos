const API = '/api'
const TOKEN_KEY = 'roadmap_token'
const EMAIL_KEY = 'roadmap_email'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function getEmail() {
  return localStorage.getItem(EMAIL_KEY) || ''
}

export function setSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EMAIL_KEY, email)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

function headers(json = false) {
  const result = {}
  if (json) {
    result['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) {
    result.Authorization = `Bearer ${token}`
  }
  return result
}

async function parse(response) {
  if (response.status === 401) {
    clearSession()
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const raw = body.error || fallbackError(response.status)
    const message =
      response.status === 404 || raw === 'Not Found'
        ? fallbackError(404)
        : raw
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  if (response.status === 204) {
    return null
  }
  return response.json()
}

function fallbackError(status) {
  if (status === 404) return 'O backend ainda não tem essa rota. Reinicie o Spring Boot na pasta backend.'
  if (status === 429) return 'Cota do Gemini esgotada. Tente novamente em alguns minutos.'
  if (status === 500) return 'O backend não está no ar. Na pasta backend, rode .\\mvnw.cmd spring-boot:run'
  if (status === 502) return 'A IA não devolveu um JSON válido.'
  if (status === 503) return 'GEMINI_API_KEY ausente ou inválida.'
  if (status === 401) return 'Faça login para continuar.'
  if (status === 403) {
    return 'Acesso recusado. Confira se o backend do Paperless está na porta 8080 — outro Spring Boot nessa porta (ex.: SelfEvolution) causa este erro.'
  }
  return `Erro ${status}`
}

async function request(method, path, body) {
  let response
  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers: headers(body != null),
      body: body == null ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error(
      'Não foi possível conectar ao backend. Confira se ele está rodando (porta 8080) e acesse o app em http://localhost:5173',
    )
  }
  return parse(response)
}

function json(method, path, body) {
  return request(method, path, body)
}

export function getHealth() {
  return request('GET', '/health')
}

export function register(email, password) {
  return json('POST', '/auth/register', { email, password })
}

export function login(email, password) {
  return json('POST', '/auth/login', { email, password })
}

export function listNodes() {
  return request('GET', '/nodes')
}

export function createNode(payload) {
  return json('POST', '/nodes', payload)
}

export function importNodes(nodes) {
  return json('POST', '/nodes/import', { nodes })
}

export function updateNode(id, payload) {
  return json('PUT', `/nodes/${id}`, payload)
}

export function patchNodeStyle(id, style) {
  return json('PATCH', `/nodes/${id}/style`, style)
}

export function updateNodeStatus(id, status) {
  return json('PATCH', `/nodes/${id}/status`, { status })
}

export function deleteNode(id) {
  return request('DELETE', `/nodes/${id}`)
}

export function listCourses(nodeId) {
  return request('GET', `/nodes/${nodeId}/courses`)
}

export function createCourse(payload) {
  return json('POST', '/courses', payload)
}

export function deleteCourse(id) {
  return request('DELETE', `/courses/${id}`)
}

export function listHistory() {
  return request('GET', '/ai/history')
}

export function recommendArchitecture(idea) {
  return json('POST', '/ai/recommend', { idea })
}

export function chatCourses(message, history = [], conversationId) {
  return json('POST', '/ai/chat', { message, history, conversationId: conversationId || null })
}
export function listConversations() {
  return request('GET', '/chat/conversations')
}

export function createConversation(title) {
  return json('POST', '/chat/conversations', title ? { title } : {})
}

export function getConversation(id) {
  return request('GET', `/chat/conversations/${id}`)
}

export function renameConversation(id, title) {
  return json('PATCH', `/chat/conversations/${id}`, { title })
}

export function deleteConversation(id) {
  return request('DELETE', `/chat/conversations/${id}`)
}

export function searchConversations(q) {
  return request('GET', `/chat/conversations/search?q=${encodeURIComponent(q)}`)
}

export function listNotes(nodeId) {
  const query = nodeId ? `?nodeId=${encodeURIComponent(nodeId)}` : ''
  return request('GET', `/notes${query}`)
}

export function createNote(payload) {
  return json('POST', '/notes', payload)
}

export function updateNote(id, payload) {
  return json('PUT', `/notes/${id}`, payload)
}

export function deleteNote(id) {
  return request('DELETE', `/notes/${id}`)
}

export function rewriteNote(payload) {
  return json('POST', '/ai/notes/rewrite', payload)
}
