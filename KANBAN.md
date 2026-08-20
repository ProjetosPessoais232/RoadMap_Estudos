# Kanban — LMS Roadmap de Estudos

Quadro de tarefas do MVP. **Login JWT; progresso e cursos por usuário.** IA: **Gemini Flash** (`gemini-2.5-flash`).

Como usar: mova o card entre as colunas (corte o bloco e cole na coluna nova). Marque `[x]` só quando a tarefa estiver **feita**. Prioridade: **P0** bloqueia o resto · **P1** entra no MVP · **P2** depois do MVP.

---

## Legenda

| Prioridade | Significado |
| ---------- | ----------- |
| P0 | Infra e domínio; sem isso nada sobe |
| P1 | MVP (árvore, progresso, cursos, Arquiteto Gemini) |
| P2 | Polimento e ideias futuras |

**Áreas:** `infra` · `backend` · `frontend` · `ia` · `docs`

---

## Backlog (a fazer)

_Nenhum card pendente. P0, P1 e P2 estão concluídos._

---

## Pronto para puxar (próximo sprint)

_Fila vazia._

---

## Em andamento (WIP — no máximo 2)

_Nenhum card em andamento._

---

## Concluído

- [x] Decisão: usuário único, sem login  
- [x] Decisão: seed da árvore **+** CRUD de nós  
- [x] Decisão: provedor de IA = **Gemini Flash** (não OpenAI / DeepSeek neste MVP)
- [x] **P0** `[infra]` PostgreSQL no Docker (`docker compose up -d`, porta 5432)
- [x] **P0** `[backend]` Spring Boot 3 + Java 21, CORS `localhost:5173`, Maven Wrapper
- [x] **P0** `[backend]` `GET /api/health` → `{ "status": "ok" }`
- [x] **P0** `[frontend]` Vite + React + Tailwind, proxy `/api` → `8080`, lista hierárquica dos nós
- [x] **P0** `[backend]` Entidade `RoadmapNode` (id slug, título, `parent_id`, status, `posX`/`posY`)
- [x] **P0** `[backend]` Enum `NOT_STARTED` · `IN_PROGRESS` · `COMPLETED`
- [x] **P0** `[backend]` API `GET/POST /api/nodes`, `PUT`, `PATCH .../status`, `DELETE` (409 se tiver filhos)
- [x] **P0** `[backend]` Seed: backend, java, spring-boot, postgresql, oracle-database, frontend, react, tailwind-css, vite
- [x] **P1** `[frontend]` Canvas React Flow com nós coloridos por status e arestas pai → filho
- [x] **P1** `[frontend]` Seleção abre o painel lateral (status, cursos, filho, delete)
- [x] **P1** `[backend]` Entidade/API `Course` (`GET /api/nodes/{id}/courses`, `POST/PUT/DELETE /api/courses`)
- [x] **P1** `[frontend]` CRUD de nós (raiz no header, filho no painel) e persistência da posição ao arrastar
- [x] **P1** `[ia]` Gemini Flash + prompt de Arquiteto + JSON (`arquitetura_resumo`, `stack_recomendada`, `nodes_para_ativar`)
- [x] **P1** `[ia]` Filtro de IDs inventados; sem chave → 503
- [x] **P1** `[frontend]` Painel Arquitetar + highlight pulsante nos nós recomendados
- [x] **P1** `[docs]` README com `docker compose`, `GEMINI_API_KEY` e como rodar
- [x] Aviso na UI quando `nodes_para_ativar` vem vazio
- [x] **P2** Empty states, loading e erros claros (IA 502 / 429 cota / JSON inválido / 503 chave)
- [x] **P2** Validação de URL dos cursos (`http`/`https`)
- [x] **P2** Login JWT + progresso e cursos por usuário
- [x] **P2** Histórico de recomendações da IA (`GET /api/ai/history`)
- [x] **P2** Streaming SSE (`POST /api/ai/recommend/stream`) com status na UI
- [x] **P2** Importar amostra estilo roadmap (`POST /api/nodes/import` + `roadmap-import.json`)
- [x] **P2** Testes E2E Playwright (`npm run test:e2e`)

---

## Ordem sugerida (dependências)

```text
Postgres ──► Spring Boot ──► API Nodes + Seed ──► React Flow (cores/status)
                 │                                      │
                 ├──► API Courses ──► Painel de cursos ─┤
                 │                                      ▼
                 └──► Gemini Flash + JSON ──► Painel IA + pulso nos nós
                                                      │
                                                      ▼
                                              CRUD nós + posições + README
```

Não comece Gemini Flash antes do seed de nós existir: a IA precisa do catálogo de IDs reais.

---

## Definição de pronto do MVP

Um card só vai para **Concluído** se:

1. Funciona localmente (backend + frontend + Postgres).  
2. Status do nó muda a cor no canvas.  
3. Curso cadastrado aparece no nó.  
4. Ideia de projeto → JSON no contrato → stack na UI + nós existentes pulsam.  
5. IDs que a IA inventar **não** viram nós novos.
