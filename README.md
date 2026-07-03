# BacklogForge

Turns a rough product idea into **BRD → PRD → FSD → a dependency-aware ticket backlog**, with sprint planning, auto-packing, a visual dependency graph, PM analytics, and CSV export for Jira or Linear. Everything runs on free tools:

**🔗 Live demo:** _add your Vercel URL here after deploying_

| Layer | Tool | Cost |
|---|---|---|
| Framework/UI | Next.js 16 + Tailwind 4 | Free (MIT) |
| Language | TypeScript | Free |
| Database | Neon Postgres | Free — 100 projects, no card |
| AI | Google Gemini Flash | Free — 1,500 requests/day, no card |
| Editor | VS Code | Free |
| Hosting | Vercel (free tier) | Free |

## Case study: why this exists

As a PM, the slowest part of shipping isn't having an idea — it's turning that idea into a business case (BRD), a spec (PRD), a behavior doc (FSD), and finally a backlog a team can actually execute against. Each handoff is where clarity gets lost: acceptance criteria drift from requirements, dependencies get missed, sprints get over-committed.

BacklogForge is a working demonstration of using AI as a PM's drafting partner, not a replacement for PM judgment: it generates a first-pass BRD/PRD/FSD and backlog from a rough idea, but every ticket goes through a human review step before it's saved (see `src/components/TicketReviewPanel.tsx`) — because an early version of this project shipped an AI-generated backlog with real architecture and security problems that needed a PM's eye to catch. Every ticket's acceptance criteria cite the exact FSD requirement it came from (traceability), dependencies are enforced (a ticket can't move to "in progress" while its blocker is unfinished), and sprint auto-packing respects both capacity and dependency order.

What's next: real two-way sync with Jira/Linear (currently CSV export only), and richer analytics — see the Roadmap below.

## The vision this is Stage 1 of

Long-term, BacklogForge grows into an AI product-discovery platform: a chat-based interview to sharpen your idea, a multi-agent document pipeline, and real two-way sync into Jira and Linear (see the plan in `~/.claude/plans/act-as-a-lead-floating-wolf.md`). **Stage 1 shipped the thinnest working version of the whole chain**; Stage 3 added the execution-side polish (Gherkin acceptance criteria, sprint auto-packing, the dependency graph); Stage 4 added PM analytics and this deployment.

Remaining differences from the full vision:
- Simple "type your idea in a box" instead of chat-based discovery
- Manual document editor instead of a three-pane visualizer with lineage lines
- CSV export instead of live Jira/Linear sync
- No file uploads, no OCR — a later-stage feature

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

## Deploying your own copy (free, no credit card)

1. Push this repo to your own GitHub account.
2. Go to https://vercel.com, sign in with GitHub, and "Import" the repo.
3. In the project's Environment Variables settings, add `DATABASE_URL` (use Neon's **pooled** connection string — Neon's dashboard has a toggle for this, needed because Vercel runs your app as short-lived serverless functions) and `GEMINI_API_KEY`.
4. Deploy. Vercel runs `prisma generate` automatically via the `postinstall` script in `package.json`.

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
| 1 ✅ | Idea → docs → tickets → CSV export | Neon, Gemini |
| 2 | File upload, prompt-completeness scoring, three-pane doc view, inline block editing | Tesseract.js (free OCR) |
| 3 ✅ | Given/When/Then acceptance criteria, visual dependency graph, auto sprint-packing | React Flow (free) |
| 4 ✅ | PM analytics (sprint velocity/commitment, cycle time), live deployment | Vercel free tier |
| 5 | Real Jira + Linear OAuth sync, field mapping, retry-on-fail | Jira free tier (10 users), Linear free tier |
| 6 | Data-retention automation, opt-out headers | Vercel free cron |

Track ideas and lessons in a `NOTES.md` in this folder — after a while it becomes the seed of the personal skill/memory system.
