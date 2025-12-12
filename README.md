# CareerAlign

CareerAlign is an AI-powered resume analyzer and ATS optimization workspace. Upload a resume PDF, paste any job description, and instantly receive a match score, skill radar, keyword gaps, and tailored recommendations.

> **Why it exists:** Recruiters spend ~7 seconds on each resume. Candidates can’t tell whether their résumé speaks the same language as the job ad. CareerAlign closes that loop with concrete insights powered by embeddings, TF–IDF, and domain-specific heuristics.

![CareerAlign dashboard preview](./public/preview.png "Add a screenshot of the analysis dashboard here")

## Table of Contents

1. [Highlights](#highlights)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Usage Guide](#usage-guide)
6. [API Flow](#api-flow-post-apianalyze)
7. [Data Persistence](#data-persistence)
8. [Deployment Notes](#deployment-notes)
9. [Troubleshooting](#troubleshooting)
10. [Project Scripts](#project-scripts)
11. [Roadmap](#roadmap)
12. [Contributing](#contributing)
13. [License](#license)

## Highlights

- **Next.js 14 App Router** with Server Components handling API/data orchestration and Client Components for interactive dashboards.
- **AI matching pipeline** that parses PDFs, sanitizes copy, segments sections, and runs Hugging Face sentence-transformer embeddings with a TF–IDF fallback.
- **Visualization-first UX** using Recharts (radar, radial gauges), Framer Motion transitions, and shadcn/ui primitives styled through Tailwind.
- **State + persistence** via Zustand on the client and MongoDB Atlas (Mongoose singleton) on the server for audit-ready job/resume comparisons.
- **Production-ready resilience** (Zod validation, file-size/type guards, IP whitelist helpers, router timeout extension) so uploads rarely fail silently.

## Architecture

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

The routing layer is edge-friendly (App Router), while the analysis pipeline uses Node runtime features (pdf parsing, axios). The singleton DB connection prevents Next.js hot-reload storms from opening multiple Atlas sockets.

## Tech Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, shadcn/ui, clsx/tailwind-merge, Framer Motion, Recharts.
- **State & Forms**: Zustand, custom drag-and-drop uploader, multipart form helpers.
- **AI & Data**: `pdf-parse`, Hugging Face router endpoint for sentence-transformers (`all-MiniLM-L6-v2`), TF–IDF fallback, Compromise NLP keyword extraction, cosine similarity helpers.
- **Backend**: Next.js route handlers, Mongoose, MongoDB Atlas, Zod validation, axios, secure env handling via `.env.local`.
- **Tooling**: ESLint, TypeScript strict mode, Vercel config (60s API timeout), npm scripts, MIT licensing.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB Atlas cluster (or any Mongo-compatible instance)
- Hugging Face account with Inference API access

### Installation

```bash
git clone https://github.com/durdensdream/CareerAlign.git
cd CareerAlign
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```bash
HUGGINGFACE_API_KEY=hf_xxx                     # Hugging Face token with Inference access
MONGODB_URI=mongodb+srv://user:pass@cluster/db # MongoDB Atlas SRV URI (trim whitespace)
```

- Generate tokens at https://huggingface.co/settings/tokens → enable **Inference Endpoints**.
- In Atlas, create a database user and whitelist your IP (`Network Access → Add IP Address → My Current IP`).
- The code defaults to the `careerAlign` database name; change it in `lib/db.ts` if needed.

## Usage Guide

1. Run the dev server: `npm run dev` and open `http://localhost:3000`.
2. Drag a PDF (≤5 MB) into the uploader or click to browse.
3. Paste a job description + title → submit.
4. Watch the stepper progress through Upload → Analysis → Insight.
5. Explore the match score gauge, keyword radar, top recommendations, and per-bucket skill analysis.
6. Repeat with multiple roles—the history is saved in MongoDB for future analytics.

## API Flow (`POST /api/analyze`)

1. Validate multipart form (PDF file + job title + job description) via Zod.
2. Parse PDF bytes (`pdf-parse`), sanitize text, and segment sections.
3. Fetch embeddings for resume + job text from Hugging Face router (`https://router.huggingface.co/feature-extraction/sentence-transformers/all-MiniLM-L6-v2`).
4. Compute cosine similarity (normalized 0–100). On error or rate limit, compute TF–IDF similarity fallback so users still get results.
5. Extract keywords with Compromise NLP, score skill buckets, build recommendations.
6. Persist payload + results to MongoDB Atlas via `models/Analysis.ts` for future analytics.

## Data Persistence

- Collection: `analyses`
- Schema fields: job title, job description hash, resume filename, insight payload (score, keyword matches/misses, skill breakdown, recommendations), timestamps.
- Atlas connection is handled via `lib/db.ts` to ensure reuse across hot reloads.

## Deployment Notes

- **Vercel**: supported out-of-the-box. `vercel.json` extends API route timeouts to 60s (needed for large PDFs + embeddings).
- **Environment secrets**: set `HUGGINGFACE_API_KEY` and `MONGODB_URI` in the hosting provider; restart deployments after changes.
- **Cold starts**: first embedding call may take ~2s; plan for caching if you need faster demo loops.

## Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `AxiosError 404 Not Found` from Hugging Face | Ensure the router URL is `https://router.huggingface.co/feature-extraction/sentence-transformers/all-MiniLM-L6-v2` and the token has inference access. |
| `MongoServerError: bad auth` or `IP address not on whitelist` | Confirm DB username/password, trim the `MONGODB_URI`, and add your current IP (or 0.0.0.0/0 for dev) in Atlas Network Access. |
| 500 error with `Missing HUGGINGFACE_API_KEY/MONGODB_URI` | Verify `.env.local` is loaded; restart `npm run dev` after editing env files. |
| Dev server stuck on embeddings | Hugging Face free tier can throttle; consider upgrading the plan or caching embeddings locally for demos. |

## Project Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start the Next.js dev server on `http://localhost:3000`. |
| `npm run build` | Create an optimized production build. |
| `npm start` | Serve the production build locally. |
| `npm run lint` | Run ESLint with the project config. |

## Roadmap

- [ ] Export analyses as polished PDF/Markdown reports.
- [ ] Add recruiter dashboard to filter and search stored analyses.
- [ ] Integrate GenAI rewrite suggestions for weak bullet points.
- [ ] Support DOCX uploads (fallback to LibreOffice conversion).

## Contributing

1. Fork the repo and create a new branch per feature/bug.
2. Run `npm run lint` before opening a PR.
3. Describe testing steps and screenshots in your PR for smoother reviews.

## License

This project is licensed under the [MIT License](./LICENSE).
