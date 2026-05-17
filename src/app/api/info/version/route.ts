import { NextResponse } from 'next/server';
import { getInfoApiUrl } from '@/src/utils/ApiUrls';

export async function GET() {
  try {
    const upstreamUrl = `${getInfoApiUrl()}/version`;
    console.info(`Starting GET ${upstreamUrl}`);
    const res = await fetch(upstreamUrl, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upstream fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

