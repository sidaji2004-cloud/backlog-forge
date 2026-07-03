# BacklogForge

Turns a rough product idea into **BRD → PRD → FSD → a real ticket backlog you can export as CSV** for Jira or Linear. Everything runs on free tools:

| Layer | Tool | Cost |
|---|---|---|
| Framework/UI | Next.js 16 + Tailwind 4 | Free (MIT) |
| Language | TypeScript | Free |
| Database | Neon Postgres | Free — 100 projects, no card |
| AI | Google Gemini Flash | Free — 1,500 requests/day, no card |
| Editor | VS Code | Free |
| Hosting | Your own machine (`npm run dev`) | Free |

## The vision this is Stage 1 of

Long-term, BacklogForge grows into an AI product-discovery platform: a chat-based interview to sharpen your idea, a multi-agent document pipeline, a visual dependency graph, and real two-way sync into Jira and Linear (see the plan in `~/.claude/plans/act-as-a-lead-floating-wolf.md`). **Stage 1 ships the thinnest working version of the whole chain** — every part is present in its simplest form. Later stages replace each piece with the richer version.

Stage 1 differences from full vision:
- Simple "type your idea in a box" instead of chat-based discovery
- Local Postgres (Neon free tier) instead of managed infra
- Manual document editor instead of three-pane visualizer with lineage lines
- CSV export instead of live Jira/Linear sync
- No file uploads, no OCR, no auto sprint-packing, no dependency graph — all Stage 3+ features

## First-time setup (one-time, both free, no credit card)

1. **Free Postgres database** — sign up at https://neon.tech with your Google or GitHub account. Create a project. Copy the "Connection string" it shows you (looks like `postgresql://user:password@host/db?sslmode=require`).
2. **Free AI key** — go to https://aistudio.google.com/apikey and click "Create API key". Copy it.
3. Copy `.env.example` to `.env.local` and paste both values in.
4. Run the initial database migration:
   ```powershell
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
5. Start the app:
   ```powershell
   npm run dev
   ```
   Then open http://localhost:3000.

## Working in VS Code

1. Open the `backlog-forge` folder in VS Code (`File → Open Folder`).
2. When it offers "recommended extensions", accept them — **Prisma**, **Tailwind CSS IntelliSense**, and **PostgreSQL Explorer** (the last one lets you browse your Neon database as tables).
3. Open the integrated terminal (`` Ctrl+` ``) and run `npm run dev`.

## Where to tinker

- `src/lib/templates.ts` — document section templates
- `src/lib/prompts.ts` — every AI prompt in plain text
- `src/lib/ai.ts` — the Gemini call and retry/fallback logic
- `src/lib/csv-actions.ts` — how tickets are exported

## Learning path (once running)

1. Create a project, write a BRD manually first from the template, so you learn each section by hand.
2. Approve it, generate the PRD with AI, edit and approve.
3. Generate the FSD, edit and approve.
4. Generate tickets. Review acceptance criteria critically — that's the actual PM skill.
5. Plan Sprint 1, then export as CSV and open it in Excel/Google Sheets to see the shape.
6. Once that clicks, run a real new idea through the same flow.

## Roadmap

| Stage | What's added | Free tools |
|---|---|---|
| 1 (now) | Idea → docs → tickets → CSV export | Neon, Gemini |
| 2 | File upload, prompt-completeness scoring, three-pane doc view, inline block editing | Tesseract.js (free OCR) |
| 3 | Given/When/Then acceptance criteria, visual dependency graph, auto sprint-packing | React Flow (free) |
| 4 | Real Jira + Linear OAuth sync, field mapping, retry-on-fail | Jira free tier (10 users), Linear free tier |
| 5 | Data-retention automation, opt-out headers | Vercel free cron |

Track ideas and lessons in a `NOTES.md` in this folder — after a while it becomes the seed of the personal skill/memory system.
