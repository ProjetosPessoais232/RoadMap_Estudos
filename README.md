# Roadmap de Estudos

LMS pessoal inspirado no roadmap.sh: árvore de tecnologias, progresso por usuário, cursos reais e um Arquiteto de Software (Gemini Flash) que destaca o que estudar.

## Stack

- Frontend: React + Vite + Tailwind CSS + React Flow
- Backend: Java 21 / Spring Boot 3 + JWT
- Banco: PostgreSQL
- IA: Gemini Flash (`gemini-2.5-flash`)

## Pré-requisitos

- Docker
- Java 21+ (o backend inclui Maven Wrapper)
- Node.js 20+
- Chave da [Gemini API](https://aistudio.google.com/apikey)

## Como rodar

Na raiz do repositório:

```bash
docker compose up -d
```

Backend:

```bash
cd backend
set GEMINI_API_KEY=sua_chave
.\mvnw.cmd spring-boot:run
```

No Linux/macOS use `export GEMINI_API_KEY=sua_chave` e `./mvnw spring-boot:run`.

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Crie uma conta (e-mail + senha). A API fica em [http://localhost:8080](http://localhost:8080).

## Uso rápido

1. Cadastre-se ou entre. O progresso e os cursos são **por usuário**.
2. Clique em um nó para mudar o status (cinza / âmbar / verde).
3. Cadastre cursos com URL `http(s)://…`.
4. Descreva uma ideia e clique em **Arquitetar**. O streaming mostra o status da consulta; o JSON final pulsa os nós recomendados.
5. Reabra recomendações antigas no **Histórico**.
6. **Importar amostra** adiciona nós extras (Redis, WebSockets, Docker, Git) no estilo de um recorte de roadmap.

Sem `GEMINI_API_KEY`, o restante do app funciona; a IA responde 503.

## Testes E2E

Com o backend no ar:

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```
