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
  if (status === 502) return 'A IA não devolveu um JSON válido.'
  if (status === 503) return 'GEMINI_API_KEY ausente ou inválida.'
  if (status === 401) return 'Faça login para continuar.'
  return `Erro ${status}`
}

function json(method, path, body) {
  return fetch(`${API}${path}`, {
    method,
    headers: headers(true),
    body: JSON.stringify(body),
  }).then(parse)
}

export function getHealth() {
  return fetch(`${API}/health`).then(parse)
}

export function register(email, password) {
  return json('POST', '/auth/register', { email, password })
}

export function login(email, password) {
  return json('POST', '/auth/login', { email, password })
}

export function listNodes() {
  return fetch(`${API}/nodes`, { headers: headers() }).then(parse)
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

export function updateNodeStatus(id, status) {
  return json('PATCH', `/nodes/${id}/status`, { status })
}

export function deleteNode(id) {
  return fetch(`${API}/nodes/${id}`, { method: 'DELETE', headers: headers() }).then(parse)
}

export function listCourses(nodeId) {
  return fetch(`${API}/nodes/${nodeId}/courses`, { headers: headers() }).then(parse)
}

export function createCourse(payload) {
  return json('POST', '/courses', payload)
}

export function deleteCourse(id) {
  return fetch(`${API}/courses/${id}`, { method: 'DELETE', headers: headers() }).then(parse)
}

export function listHistory() {
  return fetch(`${API}/ai/history`, { headers: headers() }).then(parse)
}

export function recommendArchitecture(idea) {
  return json('POST', '/ai/recommend', { idea })
}

export function chatCourses(message, history = []) {
  return json('POST', '/ai/chat', { message, history })
}
