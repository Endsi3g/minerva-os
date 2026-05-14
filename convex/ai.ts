import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// This action would call OpenAI/Anthropic to generate embeddings
export const generateEmbedding = action({
  args: { text: v.string() },
  handler: async (_ctx, args): Promise<number[]> => {
    // Placeholder: In production, call your LLM provider here
    // const embedding = await getOpenAIEmbedding(args.text);
    
    // For now, return a dummy vector of 1536 dimensions
    const dummyVector = Array.from({ length: 1536 }, () => Math.random());
    return dummyVector;
  },
});

export const searchProjects = action({
  args: { workspaceId: v.id("workspaces"), query: v.string() },
  handler: async (ctx, args): Promise<any[]> => {
    // 1. Generate embedding for the query
    const embedding = await ctx.runAction(api.ai.generateEmbedding, { text: args.query });

    // 2. Perform vector search
    const results = await ctx.vectorSearch("projects", "by_embedding", {
      vector: embedding,
      limit: 5,
      filter: (q) => q.eq("workspaceId", args.workspaceId as any),
    });

    // 3. Fetch full project documents
    const projects = await Promise.all(
      results.map(async (r: any) => {
        const doc = await ctx.runQuery(api.projects.get, { id: r._id });
        return { ...doc, _score: r._score };
      })
    );

    return projects;
  },
});

export const searchKnowledgeBase = action({
  args: { workspaceId: v.id("workspaces"), query: v.string() },
  handler: async (ctx, args): Promise<any[]> => {
    const embedding = await ctx.runAction(api.ai.generateEmbedding, { text: args.query });

    const results = await ctx.vectorSearch("knowledgeBase", "by_embedding", {
      vector: embedding,
      limit: 5,
      filter: (q) => q.eq("workspaceId", args.workspaceId as any),
    });

    const entries = await Promise.all(
      results.map(async (r: any) => {
        const doc = await ctx.runQuery(api.ai.getKnowledgeEntry, { id: r._id as any });
        return { ...doc, _score: r._score };
      })
    );

    return entries;
  },
});

export const getKnowledgeEntry = query({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const addKnowledge = action({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const textToEmbed = `${args.title} ${args.content} ${args.tags.join(" ")}`;
    const embedding = await ctx.runAction(api.ai.generateEmbedding, { text: textToEmbed });

    await ctx.runMutation(api.ai.saveKnowledge, {
      workspaceId: args.workspaceId,
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      embedding,
    });
  },
});

export const saveKnowledge = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("knowledgeBase", args);
  },
});

// Mutation to update project embedding
export const updateProjectEmbedding = action({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(api.projects.get, { id: args.id });
    if (!project) return;

    const textToEmbed = `${project.name} ${project.description || ""}`;
    const embedding = await ctx.runAction(api.ai.generateEmbedding, { text: textToEmbed });

    await ctx.runMutation(api.projects.update, {
      id: args.id,
      embedding,
    });
  },
});
