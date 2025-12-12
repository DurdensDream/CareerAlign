# CareerAlign

CareerAlign is an AI-powered resume analyzer and ATS optimization workspace. Upload a resume PDF, paste any job description, and the app delivers a match score, skill radar, keyword gaps, and tailored action items within seconds.

## Highlights

- **Next.js 14 App Router** with a split of Server Components (API + data) and Client Components (uploader, dashboards, animations).
- **AI matching pipeline** that parses PDFs, cleanses text, segments sections, and runs Hugging Face sentence-transformer embeddings with cosine similarity + TF-IDF fallback.
- **Data visualization dashboard** featuring Recharts gauges/radars, Framer Motion micro-interactions, and shadcn-style UI primitives.
- **State + persistence** backed by Zustand on the client and MongoDB Atlas (Mongoose singleton) on the server for durable analysis history.
- **Resilient API route** with Zod validation, file-size/type guards, and graceful fallbacks when external services rate limit.

## Architecture at a Glance

```
app/
  api/analyze/route.ts      ← Next.js App Route handling uploads + orchestration
  layout.tsx / page.tsx     ← Shell, global providers, main experience
components/                 ← Client UI (uploader, inputs, dashboards, stepper)
lib/
  ai-service.ts             ← PDF parsing, embeddings, TF-IDF, insight generation
  db.ts                     ← Mongoose singleton connection helper
  store.ts                  ← Zustand store powering UI state
  utils.ts / types.ts       ← Sanitization, math helpers, shared typings
models/
  Analysis.ts               ← Mongo schema for persisted runs
```

## Tech Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui, clsx/tailwind-merge, Framer Motion, Recharts.
- **State & Forms**: Zustand, custom hooks, drag-and-drop uploader.
- **AI & Data**: `pdf-parse`, Hugging Face router endpoint for sentence-transformers, TF-IDF fallback, Compromise NLP keyword extraction.
- **Backend**: Next.js route handlers, Mongoose, MongoDB Atlas, Zod validation, axios.
- **Tooling**: ESLint, TypeScript strict mode, Vercel config (60s API timeout), npm scripts.

## Getting Started

1. **Install dependencies**
  ```bash
  npm install
  ```

2. **Environment variables** – create `.env.local`:
  ```bash
  HUGGINGFACE_API_KEY=hf_xxx                     # Hugging Face token with Inference access
  MONGODB_URI=mongodb+srv://user:pass@cluster/db # MongoDB Atlas SRV URI (trim whitespace)
  ```
  - Generate tokens at https://huggingface.co/settings/tokens and enable “Access Inference Endpoints”.
  - Create a MongoDB Atlas database user, whitelist your IP (Network Access → Add IP → “My Current IP”), and copy the SRV URI. The code uses the `careerAlign` db name by default.

3. **Run the dev server**
  ```bash
  npm run dev
  ```
  Visit `http://localhost:3000` and upload a PDF under 5 MB, then paste a job description.

4. **Lint & type-check**
  ```bash
  npm run lint
  ```

5. **Production build**
  ```bash
  npm run build
  npm start
  ```

## API Flow (`POST /api/analyze`)

1. Validate multipart form (PDF file + job title + job description) via Zod.
2. Parse PDF bytes (`pdf-parse`), sanitize text, and segment sections.
3. Fetch embeddings for resume + job text from Hugging Face router (`https://router.huggingface.co/feature-extraction/...`).
4. Compute cosine similarity (normalized 0–100). On failure or rate limit, compute TF-IDF similarity fallback so users still get results.
5. Extract keywords with Compromise NLP, score skill buckets, build recommendations.
6. Persist the payload + results to MongoDB Atlas via `models/Analysis.ts` for future analytics.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `AxiosError 404 Not Found` from Hugging Face | Ensure the router URL is `https://router.huggingface.co/feature-extraction/sentence-transformers/all-MiniLM-L6-v2` and the token has inference access. |
| `MongoServerError: bad auth` or `IP address not on whitelist` | Confirm DB username/password, trim the `MONGODB_URI`, and add your current IP (or 0.0.0.0/0 for dev) in Atlas Network Access. |
| 500 error with `Missing HUGGINGFACE_API_KEY/MONGODB_URI` | Verify `.env.local` is loaded (Next.js needs a server restart after edits). |

## Project Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Next.js dev server on `http://localhost:3000`. |
| `npm run build` | Create an optimized production build. |
| `npm start` | Serve the production build locally. |
| `npm run lint` | Run ESLint with the project config. |

## License

MIT — feel free to fork, iterate, and deploy your own flavor of CareerAlign.
