import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  organizations: defineTable({
    name: v.string(),
    logoUrl: v.optional(v.string()),
    billingEmail: v.string(),
  }),

  workspaces: defineTable({
    orgId: v.optional(v.id("organizations")),
    name: v.string(),
    slug: v.string(),
    branding: v.object({
      logo: v.optional(v.string()),
      primaryColor: v.string(),
      theme: v.string(), // "light", "dark", "system"
    }),
    settings: v.object({
      currency: v.string(),
      language: v.string(),
      timezone: v.string(),
      taxRules: v.array(v.object({
        name: v.string(),
        rate: v.number(),
      })),
    }),
  }).index("by_slug", ["slug"]),

  projects: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    clientName: v.string(),
    status: v.string(), // "active", "completed", "on_hold"
    dueDate: v.string(),
    budget: v.number(),
    description: v.optional(v.string()),
    healthScore: v.optional(v.number()), // 0-100
    activeRiskFlags: v.optional(v.array(v.string())),
    embedding: v.optional(v.array(v.number())),
  }).index("by_workspace", ["workspaceId"])
    .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["workspaceId"],
  }),
  tasks: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    status: v.string(), // "todo", "in_progress", "review", "done"
    priority: v.string(), // "low", "medium", "high", "urgent"
    assignee: v.string(),
    dueDate: v.string(),
  }).index("by_project", ["projectId"])
    .index("by_workspace", ["workspaceId"]),
  approvals: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.id("projects"),
    name: v.string(),
    type: v.string(), // "design", "copy", "video", "document"
    status: v.string(), // "pending", "approved", "revision"
    submittedDate: v.string(),
    fileUrl: v.optional(v.string()),
  }).index("by_project", ["projectId"])
    .index("by_workspace", ["workspaceId"]),
  comments: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    targetId: v.string(), // ID of the approval, task, etc.
    targetType: v.string(), // "approval", "task"
    author: v.string(),
    content: v.string(),
    timestamp: v.string(),
  }).index("by_target", ["targetType", "targetId"]),

  notifications: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    userId: v.string(), // User email or ID
    title: v.string(),
    message: v.string(),
    type: v.string(), // "mention", "status_change", "task_assigned"
    read: v.boolean(),
    targetUrl: v.optional(v.string()),
    timestamp: v.string(),
  }).index("by_user", ["userId"]),
  clients: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    company: v.string(),
    contact: v.string(),
    email: v.string(),
    status: v.string(), // "active", "lead", "inactive"
  }).index("by_workspace", ["workspaceId"]),
  calls: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    title: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    attendees: v.array(v.string()),
    status: v.string(), // "upcoming", "completed", "prepped"
    summary: v.optional(v.string()),
    notesUrl: v.optional(v.string()),
    prepChecklist: v.array(v.object({
      task: v.string(),
      completed: v.boolean(),
    })),
  }).index("by_workspace", ["workspaceId"]),
  finances: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    type: v.string(), // "income", "expense"
    amount: v.number(),
    category: v.string(),
    date: v.string(),
    description: v.string(),
    tps: v.number(),
    tvq: v.number(),
    status: v.string(),
  }).index("by_workspace", ["workspaceId"]),
  fulfillment: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.id("projects"),
    serviceType: v.string(),
    status: v.string(),
    progress: v.number(),
    checklist: v.array(v.object({
      item: v.string(),
      done: v.boolean(),
    })),
  }).index("by_workspace", ["workspaceId"]),
  presence: defineTable({
    user: v.string(),
    lastActive: v.number(),
    status: v.string(),
    location: v.optional(v.string()),
  }),
  deals: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    company: v.string(),
    contact: v.string(),
    email: v.string(),
    value: v.number(),
    stage: v.string(), // "new_lead", "qualified", "proposal", "negotiation", "won", "lost"
    notes: v.optional(v.string()),
    lastContact: v.string(),
  }).index("by_workspace", ["workspaceId"]),
  invoices: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    invoiceNumber: v.string(),
    amount: v.number(),
    status: v.string(), // "paid", "pending", "overdue", "draft"
    date: v.string(),
    dueDate: v.string(),
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      price: v.number(),
    })),
    paidDate: v.optional(v.string()),
    tps: v.number(),
    tvq: v.number(),
  }).index("by_client", ["clientId"]),
  assets: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    type: v.string(), // "image", "video", "document", "other"
    size: v.number(),
    url: v.string(),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    uploadedAt: v.string(),
  }).index("by_workspace", ["workspaceId"]),
  userProfiles: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    email: v.string(),
    name: v.string(),
    role: v.string(), // "admin", "manager", "member"
    avatar: v.optional(v.string()),
  }),
  retainers: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    amount: v.number(),
    cycle: v.string(), // "monthly", "quarterly", "annual"
    status: v.string(), // "active", "paused", "cancelled"
    startDate: v.string(),
    renewalDate: v.string(),
    hoursIncluded: v.number(),
    hoursUsed: v.number(),
    notes: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),
  milestones: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.id("projects"),
    title: v.string(),
    dueDate: v.string(),
    status: v.string(), // "upcoming", "completed", "overdue"
  }).index("by_project", ["projectId"])
    .index("by_workspace", ["workspaceId"]),
  portalTokens: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    token: v.string(),
    clientId: v.id("clients"),
    expiresAt: v.string(),
    scopes: v.array(v.string()), // ["approvals", "files", "invoices", "reports"]
  }),
  activity: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    user: v.string(),
    action: v.string(), // "created_project", "completed_task", etc.
    targetName: v.string(),
    timestamp: v.string(),
    type: v.string(), // "project", "task", "invoice", etc.
  }).index("by_workspace", ["workspaceId"]),

  // --- NEW TABLES FOR AGENCY OS ---
  
  services: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    category: v.string(), // "SEO", "Paid Ads", "Branding", etc.
  }),

  packages: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.string(),
    services: v.array(v.id("services")),
    totalPrice: v.number(),
  }),

  tickets: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    subject: v.string(),
    description: v.string(),
    status: v.string(), // "open", "in_progress", "resolved", "closed"
    priority: v.string(),
    category: v.string(), // "bug", "feature", "question", "billing"
    assignedTo: v.optional(v.string()),
    slaDeadline: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  slaPolicies: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    responseTime: v.number(), // in minutes
    resolutionTime: v.number(), // in minutes
    priority: v.string(),
  }),

  // --- NEW TABLES FOR AGENTIC LAYER ---

  agents: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    role: v.string(), // "Strategist", "Orchestrator", etc.
    description: v.string(),
    instructions: v.string(),
    tools: v.array(v.string()),
    status: v.string(), // "active", "idle", "busy"
  }).index("by_workspace", ["workspaceId"]),

  agentThreads: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    agentId: v.id("agents"),
    title: v.string(),
    status: v.string(), // "active", "archived"
    metadata: v.optional(v.any()),
  }).index("by_workspace", ["workspaceId"]),

  agentMessages: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    threadId: v.id("agentThreads"),
    role: v.string(), // "user", "agent", "system"
    content: v.string(),
    toolCalls: v.optional(v.array(v.any())),
    timestamp: v.string(),
  }).index("by_thread", ["threadId"]),

  agentSuggestions: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    agentId: v.id("agents"),
    title: v.string(),
    description: v.string(),
    actionType: v.string(), // "create_task", "update_status", etc.
    actionData: v.any(),
    status: v.string(), // "pending", "approved", "rejected"
    reasoning: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  agentAudit: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    agentId: v.id("agents"),
    action: v.string(),
    details: v.any(),
    timestamp: v.string(),
  }).index("by_workspace", ["workspaceId"]),

  agentFeedback: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    suggestionId: v.id("agentSuggestions"),
    userId: v.string(),
    rating: v.number(), // 1 to 5
    comment: v.optional(v.string()),
    timestamp: v.string(),
  }),

  knowledgeBase: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    embedding: v.optional(v.array(v.number())),
  }).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["workspaceId"],
  }),

  riskFlags: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    type: v.string(), // "timeline", "scope", "approval", "relation", "finance"
    severity: v.string(), // "low", "medium", "high"
    summary: v.string(),
    details: v.string(),
    status: v.string(), // "active", "mitigated", "resolved"
    createdAt: v.string(),
  }).index("by_project", ["projectId"]),

  aiSummaries: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    clientId: v.optional(v.id("clients")),
    riskFlagId: v.optional(v.id("riskFlags")),
    type: v.string(), // "mitigation_plan", "health_report", "project_summary"
    content: v.string(),
    timestamp: v.string(),
  }).index("by_project", ["projectId"]),

  emailDrafts: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    clientId: v.id("clients"),
    subject: v.string(),
    body: v.string(),
    recipientEmail: v.string(),
    status: v.string(), // "draft", "sent", "archived"
    source: v.string(), // "agent_client_success", etc.
    timestamp: v.string(),
  }).index("by_client", ["clientId"]),

  projectNotes: defineTable({
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.id("projects"),
    title: v.string(),
    content: v.string(),
    author: v.string(),
    timestamp: v.string(),
  }).index("by_project", ["projectId"]),
});
