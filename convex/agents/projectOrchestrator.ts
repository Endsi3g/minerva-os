import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "../_generated/api";
import { tool } from "ai";
import { z } from "zod";

// Project Orchestrator Agent
// - Primary model: GPT-5.4 for deep project analysis
// - Fallback: Claude 4.6 Sonnet for nuanced language generation
export const projectOrchestratorAgent = new Agent((components as any).agent, {
  name: "Project Orchestrator",
  languageModel: openai("gpt-4o"),
  instructions: `
You are the Project Orchestrator agent for Minerva OS, an agency operating system.
Your role:
- Detect projects at risk (delays, slow approvals, scope creep, client friction).
- Generate a structured risk assessment with type, severity, and a clear mitigation plan.
- Recommend concrete tasks that the PM can validate and act on.
- Write in a clear, professional tone. Use bullet points for plans.
You only create drafts. You never execute critical actions without human validation.
When analyzing a project, consider: overdue tasks, pending approvals older than 5 days,
health score below 60, scope change count, and client sentiment from notes.
`,
  tools: {
    assessRiskWithClaude: tool({
      description:
        "Use Claude to generate a nuanced, empathetic risk summary suitable for client-facing communication",
      parameters: z.object({
        projectName: z.string(),
        riskType: z.string(),
        severity: z.string(),
        internalSummary: z.string(),
      }),
      execute: async ({ projectName, riskType, severity, internalSummary }) => {
        const model = anthropic("claude-4.6-sonnet");
        const { generateText } = await import("ai");
        const { text } = await generateText({
          model,
          prompt: `You are helping write a client-friendly risk summary. 
Project: ${projectName}
Risk type: ${riskType} (${severity} severity)
Internal summary: ${internalSummary}
Write a concise, professional, client-safe version of this risk update in 2-3 sentences.`,
        });
        return { clientSummary: text };
      },
    }),
  },
  maxSteps: 10,
});
