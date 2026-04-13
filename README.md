# Vibe Streamer

A real-time streaming chat application demonstrating end-to-end Server-Sent Events (SSE) between a **FastAPI** backend and a **Next.js** frontend. The user sends a prompt and receives a word-by-word streamed response, rendered progressively in the browser.

## Architecture Overview

```
┌─────────────────┐    POST /api/chat     ┌─────────────────┐
│                 │  ───────────────────>  │                 │
│   Next.js App   │                       │   FastAPI API    │
│   (React + TS)  │  <── SSE stream ────  │   (Python)      │
│                 │   word-by-word        │                 │
└─────────────────┘                       └─────────────────┘
     :3000                                     :8000
```

**Flow:**
1. User types a prompt and submits
2. Frontend sends `POST /api/chat` with JSON body `{ "prompt": "..." }`
3. Backend validates the prompt, delegates to the LLM service
4. LLM service streams tokens as JSON-encoded SSE events (`data: "<token>"\n\n`)
5. Frontend reads the `ReadableStream` via `getReader()`, parses SSE chunks incrementally
6. Each token is appended to the assistant message and rendered as Markdown in real-time
7. Stream completes with a `data: [DONE]\n\n` sentinel

## Prerequisites

- **Python** 3.11+
- **Node.js** 18+
- **npm** 9+

## Getting Started

### Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**.

Verify with:
```bash
curl http://localhost:8000/api/health
# {"status":"ok"}

# Test streaming:
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello"}' \
  --no-buffer
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `LLM_API_KEY` | `""` (mock mode) | API key for the LLM provider |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | Base URL for any OpenAI-compatible API |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | Model identifier |
| `LLM_SYSTEM_PROMPT` | `Respond in the same language the user writes in.` | System prompt sent to the LLM |
| `LLM_DELAY` | `0.1` | Delay between words in mock mode (seconds) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins (JSON array) |

### Frontend

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API base URL |

### Supported LLM Providers

Any OpenAI-compatible API works by changing the env vars:

| Provider | `LLM_BASE_URL` | `LLM_MODEL` (example) |
|---|---|---|
| Groq (free tier) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Together AI | `https://api.together.xyz/v1` | `meta-llama/Llama-3-70b-chat-hf` |
| Fireworks | `https://api.fireworks.ai/inference/v1` | `accounts/fireworks/models/llama-v3-70b-instruct` |

If `LLM_API_KEY` is empty, the backend uses a built-in mock that streams a hardcoded response word by word.

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router
│   │   ├── api/routes/chat.py   # POST /api/chat, GET /api/health
│   │   ├── schemas/chat.py      # Request validation (Pydantic)
│   │   ├── services/llm_stream.py  # Async LLM streaming generator
│   │   └── core/config.py       # Settings via pydantic-settings
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Main page shell
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css          # Tailwind imports
│   ├── components/chat/
│   │   ├── ChatContainer.tsx    # Orchestrator (hook + UI composition)
│   │   ├── ChatInput.tsx        # Controlled input + submit
│   │   ├── ChatMessages.tsx     # Message list + auto-scroll
│   │   └── ChatMessageItem.tsx  # Single message bubble (memoized)
│   ├── hooks/
│   │   └── useChatStream.ts     # Chat state + streaming lifecycle
│   ├── lib/
│   │   ├── api/chat.ts          # fetch + ReadableStream reader
│   │   └── stream/sse-parser.ts # SSE chunk parser with remainder buffer
│   └── types/
│       └── chat.ts              # TypeScript type definitions
│
└── README.md
```

## Key Technical Decisions

- **No `EventSource`**: The endpoint is `POST`, so we use `fetch` + manual `ReadableStream` reading with `getReader()` and `TextDecoder`.
- **JSON-encoded SSE payloads**: Each `data:` field carries a JSON string (`data: "token"\n\n`). This preserves newlines and special characters that would otherwise break the SSE format. The frontend `JSON.parse`s each payload.
- **OpenAI SDK with configurable `base_url`**: A single `openai` Python SDK supports Groq, OpenAI, Together, and any compatible provider — just change env vars, no code changes.
- **Remainder buffer**: The SSE parser handles partial chunks — a single `read()` may not deliver a complete SSE event. Leftover data is prepended to the next chunk.
- **Markdown rendering**: Assistant messages are rendered with `react-markdown` + `@tailwindcss/typography` for proper formatting of headers, lists, and code blocks.
- **`React.memo` on `ChatMessageItem`**: Prevents re-rendering all message bubbles when only the streaming message updates.
- **Functional `setState` updates**: Avoids stale closure issues during streaming callbacks.
- **LLM error handling**: Provider errors (quota, auth, rate limit) are caught and sent as SSE events to the frontend instead of crashing the stream.
- **Thin route handler**: The FastAPI endpoint delegates entirely to the service layer — no business logic in the route.
- **pydantic-settings**: Configuration via environment variables with `.env` file support, zero boilerplate.

## Troubleshooting

| Issue | Solution |
|---|---|
| CORS errors in browser console | Ensure backend is running on port 8000 and `CORS_ORIGINS` includes `http://localhost:3000` |
| Frontend shows "Network error" | Verify the backend is running: `curl http://localhost:8000/api/health` |
| Port already in use | Kill the process: `lsof -ti:8000 \| xargs kill` or use a different port |
| Python module not found | Ensure you activated the virtual environment and ran `pip install -r requirements.txt` |

## Future Improvements

- **Conversation persistence**: Store chat history in a database or localStorage
- **Tests**: pytest for backend, React Testing Library + Playwright for frontend
- **Message virtualization**: For very long conversations, virtualize the message list
- **Authentication**: Basic auth or JWT to protect the API
- **Observability**: Structured logging, OpenTelemetry tracing
- **Rate limiting**: Prevent abuse of the chat endpoint
- **Docker Compose**: Single command to spin up both services
- **Conversation context**: Send previous messages to the LLM for multi-turn conversations
