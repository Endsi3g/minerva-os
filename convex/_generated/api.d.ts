/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as agentQueries from "../agentQueries.js";
import type * as agents from "../agents.js";
import type * as agents_clientSuccess from "../agents/clientSuccess.js";
import type * as agents_projectOrchestrator from "../agents/projectOrchestrator.js";
import type * as ai from "../ai.js";
import type * as aiSummaries from "../aiSummaries.js";
import type * as approvals from "../approvals.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as calls from "../calls.js";
import type * as clients from "../clients.js";
import type * as comments from "../comments.js";
import type * as crons from "../crons.js";
import type * as cs from "../cs.js";
import type * as deals from "../deals.js";
import type * as finances from "../finances.js";
import type * as fulfillment from "../fulfillment.js";
import type * as http from "../http.js";
import type * as init from "../init.js";
import type * as invoices from "../invoices.js";
import type * as knowledgeBase from "../knowledgeBase.js";
import type * as milestones from "../milestones.js";
import type * as notifications from "../notifications.js";
import type * as portal from "../portal.js";
import type * as presence from "../presence.js";
import type * as projects from "../projects.js";
import type * as retainers from "../retainers.js";
import type * as riskFlags from "../riskFlags.js";
import type * as riskWorkflow from "../riskWorkflow.js";
import type * as seed from "../seed.js";
import type * as services from "../services.js";
import type * as settings from "../settings.js";
import type * as sla from "../sla.js";
import type * as tasks from "../tasks.js";
import type * as tickets from "../tickets.js";
import type * as userProfiles from "../userProfiles.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  agentQueries: typeof agentQueries;
  agents: typeof agents;
  "agents/clientSuccess": typeof agents_clientSuccess;
  "agents/projectOrchestrator": typeof agents_projectOrchestrator;
  ai: typeof ai;
  aiSummaries: typeof aiSummaries;
  approvals: typeof approvals;
  assets: typeof assets;
  auth: typeof auth;
  calls: typeof calls;
  clients: typeof clients;
  comments: typeof comments;
  crons: typeof crons;
  cs: typeof cs;
  deals: typeof deals;
  finances: typeof finances;
  fulfillment: typeof fulfillment;
  http: typeof http;
  init: typeof init;
  invoices: typeof invoices;
  knowledgeBase: typeof knowledgeBase;
  milestones: typeof milestones;
  notifications: typeof notifications;
  portal: typeof portal;
  presence: typeof presence;
  projects: typeof projects;
  retainers: typeof retainers;
  riskFlags: typeof riskFlags;
  riskWorkflow: typeof riskWorkflow;
  seed: typeof seed;
  services: typeof services;
  settings: typeof settings;
  sla: typeof sla;
  tasks: typeof tasks;
  tickets: typeof tickets;
  userProfiles: typeof userProfiles;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
