import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "../_generated/api";
import { tool } from "ai";
import { z } from "zod";

// Client Success Agent
// - Primary model: Claude 4.6 Sonnet for empathetic, relationship-focused writing
// - Supplementary: GPT-5.4 for structured data analysis
export const clientSuccessAgent = new Agent((components as any).agent, {
  name: "Client Success Agent",
  languageModel: anthropic("claude-3-5-sonnet-20240620"),
  instructions: `
You are the Client Success agent for Minerva OS, an agency operating system.
Your role:
- Monitor client engagement, satisfaction, and health signals.
- Propose check-ins, QBR drafts, nurturing emails, and health reports.
- Flag clients "at risk" based on: portal inactivity > 14 days, negative feedback,
  payment delays, or multiple active risk flags.
- Write in a warm, professional tone that reflects a premium agency relationship.
You never contact the client directly. You only prepare materials for the team.
All outputs are drafts requiring human review and approval.
`,
  tools: {
    analyzeEngagementWithGPT: tool({
      description:
        "Use GPT-4o to score client engagement and generate a structured health assessment",
      parameters: z.object({
        clientName: z.string(),
        portalLoginCount: z.number(),
        daysSinceLastLogin: z.number(),
        npsScore: z.number().optional(),
        openInvoicesCount: z.number(),
        activeProjectsCount: z.number(),
      }),
      execute: async (params: any) => {
        const model = openai("gpt-5.4");
        const { generateObject } = await import("ai");
        const result = await generateObject({
          model,
          schema: z.object({
            healthScore: z.number().min(0).max(100),
            riskLevel: z.enum(["low", "medium", "high"]),
            keySignals: z.array(z.string()),
            recommendedAction: z.string(),
          }),
          prompt: `Analyze client health for ${params.clientName}:
- Portal logins: ${params.portalLoginCount}, days since last login: ${params.daysSinceLastLogin}
- NPS: ${params.npsScore ?? "N/A"}, Open invoices: ${params.openInvoicesCount}
- Active projects: ${params.activeProjectsCount}
Return a health score 0-100, risk level, key signals, and recommended action.`,
        });
        return result.object;
      },
    }),
  },
  maxSteps: 8,
});
