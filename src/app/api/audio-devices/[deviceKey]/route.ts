import { NextResponse } from 'next/server';
import { getAudioDevicesApiUrl } from '@/src/utils/ApiUrls';

async function forwardDeviceRequest(method: 'GET' | 'DELETE', deviceKey: string) {
  try {
    const upstreamUrl = `${getAudioDevicesApiUrl()}/${encodeURIComponent(deviceKey)}`;
    const res = await fetch(upstreamUrl, {
      method,
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }

    const text = await res.text();
    return new NextResponse(text || null, {
      status: res.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Upstream device request failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceKey: string }> }
) {
  const { deviceKey } = await params;
  return forwardDeviceRequest('GET', deviceKey);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ deviceKey: string }> }
) {
  const { deviceKey } = await params;
  return forwardDeviceRequest('DELETE', deviceKey);
}

