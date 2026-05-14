import { WorkflowManager } from "@convex-dev/workflow";
import { z } from "zod";

import { components, internal } from "./_generated/api";
import { internalAction, internalMutation, action, query } from "./_generated/server";
import { v } from "convex/values";
import { projectOrchestratorAgent } from "./agents/projectOrchestrator";

const workflow = new WorkflowManager(components.workflow as any);

// --- Durable Workflow Definition ---

export const projectRiskWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    pmEmail: v.string(),
  },
  handler: async (step, { projectId, workspaceId, pmEmail }) => {
    // Step 1: Snapshot current metrics before agent runs
    const initialMetrics = await step.runQuery(internal.riskWorkflow.getProjectMetrics, {
      projectId,
    });

    // Step 2: Create a persistent thread for this project risk analysis
    const { threadId } = await step.runMutation(internal.riskWorkflow.createRiskThread, {
      workspaceId,
      projectId,
    });

    // Step 3: Run the Project Orchestrator agent (retry on failure)
    await step.runAction(
      internal.riskWorkflow.generateProjectRiskPlan,
      { projectId, workspaceId, pmEmail, threadId },
    );

    // Step 4: Wait 3 days and check if the situation has improved
    await step.sleep(3 * 24 * 60 * 60 * 1000);

    // Step 5: Re-evaluate
    const updatedMetrics = await step.runQuery(internal.riskWorkflow.getProjectMetrics, {
      projectId,
    });

    const improved =
      (updatedMetrics?.healthScore ?? 50) > (initialMetrics?.healthScore ?? 50) + 10;

    if (!improved) {
      await step.runMutation(internal.notifications.notifyOwnerAboutStalledRisk, {
        workspaceId,
        projectId,
        pmId: pmEmail,
      });
    }
  },
});

// --- Internal helpers ---

export const getProjectMetrics = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    const pendingApprovals = await ctx.db
      .query("approvals")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .filter((q: any) => q.eq(q.field("status"), "pending"))
      .collect();

    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done",
    );

    return {
      healthScore: project.healthScore ?? 100,
      overdueTasks: overdueTasks.length,
      pendingApprovals: pendingApprovals.length,
      totalTasks: tasks.length,
    };
  },
});

export const getRecentProjectNotes = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("projectNotes")
      .withIndex("by_project", (q: any) => q.eq("projectId", projectId))
      .order("desc")
      .take(10);
  },
});

export const createRiskThread = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, { workspaceId, projectId }) => {
    const project = await ctx.db.get(projectId);
    const result = await projectOrchestratorAgent.createThread(ctx as any, {
      title: `Risk Analysis: ${project?.name ?? projectId}`,
      metadata: { workspaceId, projectId } as any,
    }) as any;
    const threadId = result.threadId;
    return { threadId };
  },
});

// --- Core agent action ---

export const generateProjectRiskPlan = internalAction({
  args: {
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    pmEmail: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { projectId, workspaceId, pmEmail, threadId }) => {
    // Gather context
    const dashboard = await ctx.runQuery(internal.projects.getProjectDashboard, { projectId });
    const metrics = await ctx.runQuery(internal.riskWorkflow.getProjectMetrics, { projectId });
    const notes = await ctx.runQuery(internal.riskWorkflow.getRecentProjectNotes, { projectId });

    // Continue the persistent thread with the agent
    const { thread } = await projectOrchestratorAgent.continueThread(ctx as any, { threadId }) as any;

    // Use structured output to get a typed risk plan
    const result = await thread.generateText({
      prompt: `Analyze this project and produce a structured risk assessment.

Project Dashboard: ${JSON.stringify(dashboard, null, 2)}
Metrics: ${JSON.stringify(metrics, null, 2)}
Recent Notes: ${JSON.stringify(notes, null, 2)}

Respond with a JSON block in this format:
{
  "riskType": "timeline|scope|approval|relation|finance",
  "severity": "low|medium|high",
  "summary": "one sentence",
  "planText": "multi-line mitigation plan",
  "healthScoreDelta": -10,
  "suggestedTasks": [
    {"title": "...", "description": "...", "suggestedDueDate": "YYYY-MM-DD"}
  ]
}`,
    });

    // Parse the structured JSON from the response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Agent did not return a valid JSON risk plan");
    }

    const plan = JSON.parse(jsonMatch[0]) as {
      riskType: string;
      severity: string;
      summary: string;
      planText: string;
      healthScoreDelta: number;
      suggestedTasks: Array<{
        title: string;
        description: string;
        suggestedDueDate?: string;
      }>;
    };

    const currentHealth = metrics?.healthScore ?? 80;

    // 1. Create a risk flag
    const riskFlagId = await ctx.runMutation(internal.riskFlags.createProjectRiskFlag, {
      workspaceId,
      projectId,
      type: plan.riskType,
      severity: plan.severity,
      summary: plan.summary,
      details: plan.planText,
    });

    // 2. Update project health score
    await ctx.runMutation(internal.projects.updateProjectHealth, {
      projectId,
      healthScore: Math.max(0, currentHealth + plan.healthScoreDelta),
      riskFlags: [plan.riskType],
    });

    // 3. Create draft tasks
    for (const t of plan.suggestedTasks) {
      await ctx.runMutation(internal.tasks.createTaskDraft, {
        workspaceId,
        projectId,
        title: t.title,
        description: t.description,
        suggestedDueDate: t.suggestedDueDate,
        source: "agent_project_orchestrator",
      });
    }

    // 4. Store the mitigation plan
    await ctx.runMutation(internal.aiSummaries.createRiskMitigationPlan, {
      workspaceId,
      projectId,
      riskFlagId,
      planText: plan.planText,
    });

    // 5. Notify the PM
    await ctx.runMutation(internal.notifications.notifyPMAboutRisk, {
      workspaceId,
      projectId,
      pmId: pmEmail,
      riskFlagId,
      summary: plan.summary,
      suggestedActions: plan.suggestedTasks.map((t) => t.title),
    });
  },
});

// --- Public entry point to trigger the workflow ---

export const startProjectRiskWorkflow = action({
  args: {
    projectId: v.id("projects"),
    workspaceId: v.id("workspaces"),
    pmEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const workflowId = await workflow.start(ctx as any, internal.riskWorkflow.projectRiskWorkflow, args);
    return { workflowId };
  },
});

export const getWorkflowStatus = query({
  args: { workflowId: v.string() },
  handler: async (ctx, { workflowId }) => {
    return await workflow.status(ctx, workflowId as any);
  },
});

export const getActiveProjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("projects")
      .filter((q: any) => q.neq(q.field("status"), "completed"))
      .collect();
  },
});

export const checkAllProjectsForRisk = internalAction({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.runQuery(internal.riskWorkflow.getActiveProjects);
    
    for (const project of projects) {
      // In a real app we'd fetch the actual PM email, using a dummy one for now
      const pmEmail = "pm@minerva-os.com"; 
      
      await workflow.start(ctx as any, internal.riskWorkflow.projectRiskWorkflow, {
        projectId: project._id,
        workspaceId: project.workspaceId as any,
        pmEmail: pmEmail,
      });
    }
  },
});
