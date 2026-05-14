import { mutation } from "./_generated/server";

export const initializeSystem = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Create default workspace
    const workspaceId = await ctx.db.insert("workspaces", {
      name: "Minerva Agency",
      slug: "minerva-agency",
      branding: {
        primaryColor: "#c96442", // Terracotta from GEMINI.md
        theme: "system",
      },
      settings: {
        currency: "USD",
        language: "en",
        timezone: "UTC",
        taxRules: [
          { name: "TPS", rate: 5 },
          { name: "TVQ", rate: 9.975 },
        ],
      },
    });

    // 2. Create core agents
    const agents = [
      {
        name: "Minerva Strategist",
        role: "Strategist",
        description: "Analyzes briefs and campaign results to suggest strategic pivots and upsells.",
        instructions: "You are the Minerva Strategist. Your goal is to maximize client ROI and agency revenue by identifying opportunities in data.",
        tools: ["queryProjects", "queryClients", "analyzeCampaigns"],
        status: "active",
      },
      {
        name: "Minerva Orchestrator",
        role: "Orchestrator",
        description: "Monitors deadlines and workloads to ensure smooth project delivery.",
        instructions: "You are the Minerva Orchestrator. You ensure everything runs on time and alert humans to bottlenecks.",
        tools: ["queryTasks", "createTask", "updateTaskStatus"],
        status: "active",
      },
      {
        name: "Minerva Finance",
        role: "Finance",
        description: "Monitors margins and retainer utilization.",
        instructions: "You are the Minerva Finance agent. You track profitability and alert on under-utilized retainers or unpaid invoices.",
        tools: ["queryFinances", "queryInvoices", "queryRetainers"],
        status: "active",
      },
    ];

    for (const agent of agents) {
      await ctx.db.insert("agents", {
        workspaceId,
        ...agent,
      });
    }

    return { workspaceId };
  },
});
