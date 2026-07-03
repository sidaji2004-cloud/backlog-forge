import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BacklogForge — AI-drafted BRDs, PRDs, and backlogs for PMs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fafafa",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#7c3aed",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            BacklogForge
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 68,
              fontWeight: 700,
              color: "#18181b",
              lineHeight: 1.15,
              maxWidth: 960,
            }}
          >
            Turn a rough idea into a real PM backlog.
          </div>
          <div
            style={{
              marginTop: 32,
              fontSize: 32,
              color: "#52525b",
              lineHeight: 1.4,
              maxWidth: 960,
            }}
          >
            Idea → BRD → PRD → FSD → tickets → sprints, all AI-drafted,
            reviewable, and exportable to Jira or Linear.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "#71717a",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              background: "#18181b",
              color: "white",
              borderRadius: 6,
              fontSize: 22,
              fontWeight: 500,
            }}
          >
            backlog-forge.vercel.app
          </div>
          <div>Free tools only · Built by a PM learning to ship</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
