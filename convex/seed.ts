import { mutation } from "./_generated/server";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Seed Clients
    await ctx.db.insert("clients", {
      company: "Acme Quebec Inc",
      contact: "Jean Dupont",
      email: "jean@acme.qc.ca",
      status: "active",
    });

    // Seed Projects
    const projectId = await ctx.db.insert("projects", {
      name: "Refonte Site Web 2026",
      clientName: "Acme Quebec Inc",
      status: "active",
      dueDate: "2026-12-31",
      budget: 15000,
    });

    // Seed Finances
    await ctx.db.insert("finances", {
      type: "income",
      amount: 5000,
      description: "Initial Payment - Project Refonte",
      category: "Services",
      date: "2026-05-10",
      tps: 250,
      tvq: 498.75,
      status: "paid",
    });

    await ctx.db.insert("finances", {
      type: "expense",
      amount: 120,
      description: "Vercel Pro Subscription",
      category: "Software",
      date: "2026-05-12",
      tps: 6,
      tvq: 11.97,
      status: "paid",
    });

    // Seed Calls
    await ctx.db.insert("calls", {
      title: "Strategic Review: Acme Quebec",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      attendees: ["Olivier G.", "Jean Dupont"],
      status: "upcoming",
      prepChecklist: [
        { task: "Review previous month metrics", completed: true },
        { task: "Prepare Q3 proposal", completed: false },
        { task: "Verify Granola notes from last sync", completed: false },
      ],
    });

    // Seed Fulfillment
    await ctx.db.insert("fulfillment", {
      projectId: projectId,
      serviceType: "onboarding",
      status: "in_progress",
      progress: 65,
      checklist: [
        { item: "Access to Google Analytics", done: true },
        { item: "Brand guidelines received", done: true },
        { item: "Kickoff meeting held", done: true },
        { item: "Technical audit started", done: false },
        { item: "Final report template approved", done: false },
      ],
    });
    // Seed Deals (CRM)
    await ctx.db.insert("deals", {
      company: "Luminary Group",
      contact: "Sophie Bernard",
      email: "sophie@luminarygroup.co",
      value: 18000,
      stage: "new_lead",
      lastContact: "2026-05-12",
    });

    await ctx.db.insert("deals", {
      company: "Apex Creative Co.",
      contact: "Isabelle Fontaine",
      email: "isabelle@apexcreative.fr",
      value: 41000,
      stage: "proposal",
      lastContact: "2026-05-10",
    });

    // Seed Invoices
    const clientId = await ctx.db.insert("clients", {
      company: "Stratum Labs",
      contact: "Felix Braun",
      email: "felix@stratumlabs.de",
      status: "active",
    });

    await ctx.db.insert("invoices", {
      clientId,
      invoiceNumber: "INV-2026-041",
      amount: 8000,
      status: "paid",
      date: "2026-05-01",
      dueDate: "2026-05-15",
      items: [
        { description: "Brand strategy retainer — May", quantity: 1, price: 5000 },
        { description: "Logo suite production", quantity: 1, price: 3000 },
      ],
      tps: 400,
      tvq: 798,
    });

    // Seed Tasks
    await ctx.db.insert("tasks", {
      projectId,
      title: "Finalise logo variations",
      status: "review",
      priority: "high",
      assignee: "JR",
      dueDate: "2026-06-14",
    });

    // Seed User Profiles
    await ctx.db.insert("userProfiles", {
      email: "admin@minerva.os",
      name: "Olivier G.",
      role: "admin",
    });

    // Seed Portal Tokens
    await ctx.db.insert("portalTokens", {
      token: "demo-stratum",
      clientId,
      expiresAt: "2027-12-31T23:59:59Z",
      scopes: ["approvals", "files", "invoices"],
    });

    // Seed Approvals
    await ctx.db.insert("approvals", {
      projectId,
      name: "Logo Suite v3",
      type: "design",
      status: "pending",
      submittedDate: "2026-06-09",
    });

    // Seed Milestones
    await ctx.db.insert("milestones", {
      projectId,
      title: "Logo suite approved",
      dueDate: "2026-06-14",
      status: "upcoming",
    });
    // Seed Activity
    await ctx.db.insert("activity", {
      user: "Olivier G.",
      action: "completed task",
      targetName: "Information architecture audit",
      timestamp: new Date().toISOString(),
      type: "task",
    });

    await ctx.db.insert("activity", {
      user: "Olivier G.",
      action: "created project",
      targetName: "Brand Identity Refresh",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: "project",
    });
  },
});
