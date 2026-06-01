import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';

let pipelinePromise: any = null;

async function getEmbedder() {
  if (!pipelinePromise) {
    // Dynamically import to ensure the ESM package is loaded on demand
    const { pipeline, env } = await import('@xenova/transformers');
    env.localModelPath = '';
    env.allowLocalModels = false;
    
    pipelinePromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return pipelinePromise;
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    void user;

    const { text } = (await req.json()) as { text: string };
    if (!text) {
      return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
    }

    const extractor = await getEmbedder();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data) as number[];

    return NextResponse.json({ embedding });
  } catch (err) {
    console.error('[Embed API Error]:', err);
    return NextResponse.json({ error: 'Failed to generate embedding.' }, { status: 500 });
  }
}
