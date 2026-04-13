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
