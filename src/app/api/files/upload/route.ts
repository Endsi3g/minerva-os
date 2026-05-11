import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const projectId = formData.get('projectId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  // TODO: stream file to S3/R2/GCS and save record to DB
  // const buffer = Buffer.from(await file.arrayBuffer());
  // const key = `${projectId}/${Date.now()}_${file.name}`;
  // await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: buffer }));

  const mockAsset = {
    id: `file_${Date.now()}`,
    name: file.name,
    size: `${(file.size / 1024).toFixed(1)} KB`,
    type: file.type,
    projectId,
    url: `/files/mock/${file.name}`,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json({ asset: mockAsset }, { status: 201 });
}
