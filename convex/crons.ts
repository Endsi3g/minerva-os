import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Weekly Project Health Audit — every Monday at 08:00 UTC
crons.cron(
  "weekly-health-check",
  "0 8 * * 1",
  api.activity.logSystemEvent,
  { action: "audit", targetName: "All Projects", type: "system" }
);

// Daily Notification Cleanup — 03:00 UTC
crons.cron(
  "daily-cleanup",
  "0 3 * * *",
  api.notifications.cleanupOld
);

// Daily Project Risk Scan (AGI Workflow) — 04:00 UTC
crons.cron(
  "daily-project-risk-scan",
  "0 4 * * *",
  internal.riskWorkflow.checkAllProjectsForRisk
);

export default crons;
