// Central copy library for the in-app HelpTip ("?") component.
// Every jargon term surfaced anywhere in the UI has its explanation here,
// so a copy edit is always a one-file change.

export type HelpTerm =
  | "brd"
  | "prd"
  | "fsd"
  | "ticket-board"
  | "sprints-box"
  | "execution-box"
  | "backlog-status"
  | "todo-status"
  | "in-progress-status"
  | "done-status"
  | "story-points"
  | "capacity"
  | "priority"
  | "estimate"
  | "auto-pack"
  | "blocked"
  | "dependency"
  | "cycle-time"
  | "velocity"
  | "sprint-commitment-vs-completion"
  | "generate-with-ai"
  | "regenerate-with-ai"
  | "approve-doc"
  | "review-tickets"
  | "board-tab"
  | "graph-tab"
  | "sprints-tab"
  | "analytics-tab"
  | "export-csv";

export const HELP: Record<HelpTerm, { title: string; body: string }> = {
  brd: {
    title: "BRD — Business Requirements Document",
    body: "The 'why' document. Answers: what business problem does this solve, who benefits, and how will we know it worked? Example line: 'Reduce refund-request handling time from 3 days to same-day.' No tech details — this is what a PM would show a business stakeholder.",
  },
  prd: {
    title: "PRD — Product Requirements Document",
    body: "The 'what' document. Answers: what features are we building, for which users, in what priority order? Builds on the approved BRD. Example line: 'As a refund manager, I want a single view of all pending refund requests so I can process them in one sitting.'",
  },
  fsd: {
    title: "FSD — Functional Specification Document",
    body: "The 'how it behaves' document. Answers: what screens exist, what rules apply, what happens on edge cases? Builds on the approved PRD. Example line: 'When a refund is above $500, the app requires a second approver before submitting.'",
  },

  "ticket-board": {
    title: "Ticket board — the kitchen ticket rail",
    body: "A restaurant kitchen clips every order to a ticket rail and moves it left-to-right as it's cooked. The Board tab is the software equivalent: every feature from the FSD becomes a card, and you can see at a glance what's not started, coming up, in progress right now, and shipped. This is the live status of every piece of work.",
  },
  "sprints-box": {
    title: "Sprints — the shift schedule",
    body: "A kitchen doesn't try to cook every dish at once; they plan today's shift. A sprint is a fixed 1–2 week window where you commit to a specific batch of tickets from the backlog. This is where you say 'for the next two weeks we're doing these 8 tickets, that's 20 points, we have capacity for 20.'",
  },
  "execution-box": {
    title: "Execution — from spec to shipped",
    body: "The documents describe the destination. The Board tracks every step of the journey; Sprints group those steps into manageable time chunks. Real engineering teams live in tools like Jira or Linear day-to-day — the Export CSV button on the Board is the handoff, so BacklogForge does the AI-heavy planning and Jira/Linear takes over from there.",
  },

  "backlog-status": {
    title: "Backlog",
    body: "Tickets that exist but nobody has started or scheduled yet. Everything begins here after generation. Pull items from Backlog into Todo when you're ready to schedule them.",
  },
  "todo-status": {
    title: "Todo",
    body: "Tickets scheduled for someone to pick up next, but not started yet. Usually the current sprint's committed work sits here.",
  },
  "in-progress-status": {
    title: "In progress",
    body: "Someone is actively working on this right now. If a ticket has an unfinished blocker (see 'dependency'), the app won't let it enter this column — a red toast tells you which blocker to finish first.",
  },
  "done-status": {
    title: "Done",
    body: "Shipped and verified. The moment a ticket enters Done, the app timestamps it (completedAt) so the Analytics tab can calculate cycle time — how long the ticket took from creation to done.",
  },

  "story-points": {
    title: "Story points — rough size, not hours",
    body: "A rough size for a ticket. 1 = trivial, 5 = a whole week. Deliberately fuzzy so nobody argues whether something is 3.5 hours or 4. A whole team's rhythm ('we usually ship 20 points per sprint') is called velocity.",
  },
  capacity: {
    title: "Sprint capacity",
    body: "The maximum story points you're willing to commit to in one sprint, based on how many the team usually ships (their velocity). If capacity is 20 and Auto-pack fills the sprint, it stops adding tickets once total estimates reach 20.",
  },
  priority: {
    title: "Priority",
    body: "How important this ticket is. High > medium > low. Auto-pack packs high-priority tickets first, then medium, then low, respecting dependencies within each tier.",
  },
  estimate: {
    title: "Estimate",
    body: "The story-points size of this specific ticket (see 'story points'). Used by Auto-pack to sum up against sprint capacity, and by the Analytics tab to compute velocity.",
  },

  "auto-pack": {
    title: "Auto-pack — one-click sprint fill",
    body: "Fills this sprint's remaining capacity from the unassigned backlog. Picks by priority (high first), respects dependency order (won't add a ticket if its blocker isn't already in this sprint or already done), and stops when capacity is reached. Real teams do this manually in a sprint planning meeting; the AI-drafted backlog makes it safe to automate.",
  },
  blocked: {
    title: "Blocked ticket",
    body: "A ticket that can't move to In progress or Done because at least one of its dependencies (blockers) isn't finished yet. The app enforces this — you'll get a red toast telling you which blocker to finish first.",
  },
  dependency: {
    title: "Dependency (blocker)",
    body: "'Ticket A blocks Ticket B' means B can't start until A is done. Common example: the 'set up database schema' ticket blocks every ticket that needs to save data. Add dependencies on the Graph tab by dragging from one ticket's right edge to another's left edge.",
  },

  "cycle-time": {
    title: "Cycle time",
    body: "How long a ticket takes from creation to being marked Done. Average cycle time across all completed tickets is a good health signal — if it's climbing, tickets are stuck longer than they used to be.",
  },
  velocity: {
    title: "Velocity",
    body: "Story points shipped per sprint. If you shipped 18 points last sprint and 22 this sprint, velocity is trending up. Real teams use their last 3 sprints' average as next sprint's capacity.",
  },
  "sprint-commitment-vs-completion": {
    title: "Committed vs completed",
    body: "The Analytics chart shows two bars per sprint: gray = points you committed to at the start, green = points you actually finished. A big gap tells you the sprint was over-planned. Consistent green matching gray = the team's calibrating well.",
  },

  "generate-with-ai": {
    title: "Generate with AI",
    body: "Sends your idea (plus any prior approved documents) to Google Gemini and returns a first-pass draft. You review, edit, and approve — the AI drafts, you decide. This is the fastest way from rough idea to real deliverable.",
  },
  "regenerate-with-ai": {
    title: "Regenerate",
    body: "Ask Gemini for a fresh draft while keeping the previous version as a snapshot. Useful if the current draft is off-topic or too shallow — the app saves both so you can compare.",
  },
  "approve-doc": {
    title: "Approve document",
    body: "Marks this document as final for now. Approving is required before the next document can be generated: PRD needs an approved BRD, FSD needs an approved PRD, and tickets need an approved PRD + FSD. This is what stops half-baked drafts from poisoning downstream generations.",
  },
  "review-tickets": {
    title: "Review tickets before saving",
    body: "The AI proposes a list of tickets. You deselect any that are wrong, off-scope, or duplicated before hitting Save. Real PMs do this instinctively — the review step exists because the very first version of this app once saved an AI-generated backlog with genuine security and architecture problems.",
  },

  "board-tab": {
    title: "Board tab",
    body: "Kanban view. See every ticket in its current status column and drag it between columns as work progresses.",
  },
  "graph-tab": {
    title: "Graph tab",
    body: "See ticket dependencies as arrows. Drag from one ticket's right edge to another's left edge to add a dependency. Attempting a cycle (A blocks B, B blocks A) is rejected.",
  },
  "sprints-tab": {
    title: "Sprints tab",
    body: "Plan sprints — create one, set a capacity, then either assign tickets manually or click Auto-pack to fill it by priority + dependency order.",
  },
  "analytics-tab": {
    title: "Analytics tab",
    body: "Sprint-by-sprint committed-vs-completed chart, plus cycle-time summary. The metrics real PMs watch: velocity trend, cycle time, and whether the team is over-committing.",
  },

  "export-csv": {
    title: "Export CSV — the Jira/Linear handoff",
    body: "Real engineering teams live inside Jira, Linear, or ClickUp — they won't switch tools mid-project. BacklogForge is the AI-heavy planning tool; the CSV export is how the finished backlog gets into wherever the team actually works. Pick Jira or Linear format and the columns match what those tools expect.",
  },
};
