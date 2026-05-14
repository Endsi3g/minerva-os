import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

// Weekly Project Health Audit
crons.weekly(
  "weekly-health-check",
  { hourUTC: 8, minuteUTC: 0, dayOfWeek: "monday" },
  api.activity.logSystemEvent,
  { action: "audit", targetName: "All Projects", type: "system" }
);

// Daily Notification Cleanup
crons.daily(
  "daily-cleanup",
  { hourUTC: 3, minuteUTC: 0 },
  api.notifications.cleanupOld
);

// Daily Project Risk Scan (AGI Workflow)
crons.daily(
  "daily-project-risk-scan",
  { hourUTC: 4, minuteUTC: 0 },
  internal.riskWorkflow.checkAllProjectsForRisk
);

export default crons;
