import { GoogleGenAI, Type, ApiError } from "@google/genai";
import { z } from "zod";
import {
  SYSTEM_PROMPT,
  brdPrompt,
  prdPrompt,
  fsdPrompt,
  ticketsPrompt,
  clarifyingQuestionsPrompt,
} from "@/lib/prompts";
import type { DocType } from "@/lib/templates";

// Google Gemini free tier: 1,500 requests/day, no credit card.
// Get a free key at https://aistudio.google.com/apikey
const PRIMARY_MODEL = "gemini-3.5-flash";
// Falls back here if the primary model is rate-limited (429) or Google's
// servers are overloaded (503) — a different model draws from a separate
// free-tier quota, so it often succeeds while the primary is still busy.
const FALLBACK_MODEL = "gemini-2.5-flash";

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/apikey and put it in backlog-forge/.env.local"
    );
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 503;
}

function friendlyErrorFor(status: number | undefined): string {
  if (status === 429) {
    return "Gemini's free-tier rate limit was hit. Wait about a minute and try again.";
  }
  if (status === 503) {
    return "Google's Gemini servers are busy right now — this is on Google's end, not your key. Please try again in a minute.";
  }
  return "AI generation failed. Please try again.";
}

/**
 * Calls `call(model)` against the primary model with exponential backoff +
 * jitter on 429/503, then falls back to a second free Gemini model (a
 * separate quota) once if the primary keeps failing for the same reason.
 */
async function callWithRetry<T>(
  call: (model: string) => Promise<T>
): Promise<T> {
  const delaysMs = [500, 1500, 4000];
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await call(PRIMARY_MODEL);
    } catch (err) {
      lastStatus = err instanceof ApiError ? err.status : undefined;
      if (!isRetryableStatus(lastStatus) || attempt === delaysMs.length) break;
      await sleep(delaysMs[attempt] + Math.random() * 250);
    }
  }

  if (isRetryableStatus(lastStatus)) {
    try {
      return await call(FALLBACK_MODEL);
    } catch (err) {
      throw new Error(
        friendlyErrorFor(err instanceof ApiError ? err.status : lastStatus)
      );
    }
  }

  throw new Error(friendlyErrorFor(lastStatus));
}

/**
 * Generate a BRD, PRD or FSD as markdown. `context` is the upstream doc.
 * `discoveryContext` (BRD only) is the optional audience/tech-stack/
 * constraints text from the New Project form.
 */
export async function generateDocument(
  type: DocType,
  idea: string,
  context: string | null,
  discoveryContext?: string
): Promise<string> {
  const ai = getClient();

  let prompt: string;
  if (type === "BRD") prompt = brdPrompt(idea, discoveryContext);
  else if (type === "PRD") {
    if (!context) throw new Error("A BRD is needed before generating a PRD.");
    prompt = prdPrompt(idea, context);
  } else {
    if (!context) throw new Error("A PRD is needed before generating an FSD.");
    prompt = fsdPrompt(idea, context);
  }

  const response = await callWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 16384,
      },
    })
  );

  const text = response.text?.trim();
  if (!text) throw new Error("The model returned an empty document. Try again.");
  return text;
}

const questionsResponseSchema = {
  type: Type.OBJECT,
  required: ["questions"],
  properties: {
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Up to 3 short clarifying questions, fewer if not needed",
    },
  },
};

/** Optional pre-BRD step: ask Gemini for up to 3 clarifying questions. */
export async function generateClarifyingQuestions(
  idea: string,
  discoveryContext?: string
): Promise<string[]> {
  const ai = getClient();

  const response = await callWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: clarifyingQuestionsPrompt(idea, discoveryContext),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: questionsResponseSchema,
      },
    })
  );

  const raw = response.text;
  if (!raw) return [];

  try {
    const parsed = z
      .object({ questions: z.array(z.string()) })
      .parse(JSON.parse(raw));
    return parsed.questions.filter((q) => q.trim().length > 0).slice(0, 3);
  } catch {
    return []; // a bad response here just skips straight to BRD generation
  }
}

export const GeneratedTicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  estimate: z.number().int(),
  sourceSection: z.string(),
  dependsOn: z.array(z.number().int()),
});

const TicketListSchema = z.object({
  tickets: z.array(GeneratedTicketSchema),
});

export type GeneratedTicket = z.infer<typeof GeneratedTicketSchema>;

// Gemini structured-output schema mirroring TicketListSchema
const ticketResponseSchema = {
  type: Type.OBJECT,
  required: ["tickets"],
  properties: {
    tickets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: [
          "title",
          "description",
          "acceptanceCriteria",
          "priority",
          "estimate",
          "sourceSection",
          "dependsOn",
        ],
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          acceptanceCriteria: {
            type: Type.STRING,
            description: "Markdown checklist of testable done-conditions",
          },
          priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
          estimate: { type: Type.INTEGER, description: "Story points, 1-5" },
          sourceSection: {
            type: Type.STRING,
            description: "PRD/FSD section this ticket traces to",
          },
          dependsOn: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description:
              "0-based indexes of tickets in this list that must finish first",
          },
        },
      },
    },
  },
};

/** Generate structured tickets from an approved PRD (and optional FSD). */
export async function generateTickets(
  prd: string,
  fsd: string | null
): Promise<GeneratedTicket[]> {
  const ai = getClient();

  const response = await callWithRetry((model) =>
    ai.models.generateContent({
      model,
      contents: ticketsPrompt(prd, fsd),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 16384,
        responseMimeType: "application/json",
        responseSchema: ticketResponseSchema,
      },
    })
  );

  const raw = response.text;
  if (!raw) throw new Error("The model returned no tickets. Try again.");

  let parsed: z.infer<typeof TicketListSchema>;
  try {
    parsed = TicketListSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error("The model returned an invalid ticket list. Try again.");
  }
  if (parsed.tickets.length === 0) {
    throw new Error("The model returned an empty ticket list. Try again.");
  }

  // sanity-check dependency indexes so bad output can't corrupt the DB
  const n = parsed.tickets.length;
  for (const t of parsed.tickets) {
    t.dependsOn = t.dependsOn.filter((i) => i >= 0 && i < n);
  }
  return parsed.tickets;
}
