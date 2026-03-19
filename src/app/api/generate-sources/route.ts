import { NextRequest, NextResponse } from 'next/server';
import { generateSources } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { subject, topic } = await req.json() as { subject: string; topic: string };

  if (!subject || !topic) {
    return NextResponse.json({ error: '과목과 주제가 필요합니다.' }, { status: 400 });
  }

  const sources = await generateSources({ subject, topic });
  return NextResponse.json({ sources });
}
