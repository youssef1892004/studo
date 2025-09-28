import { NextRequest, NextResponse } from 'next/server';

async function getAccessToken() {
  if (!process.env.TTS_API_BASE_URL || !process.env.TTS_API_USERNAME || !process.env.TTS_API_PASSWORD) {
    throw new Error("TTS Service environment variables are not configured in .env.local");
  }

  const response = await fetch(`${process.env.TTS_API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: process.env.TTS_API_USERNAME,
      password: process.env.TTS_API_PASSWORD,
    }),
    cache: 'no-store', // منع التخزين المؤقت
  });

  if (!response.ok) {
    console.error("Authentication failed with TTS service. Status:", response.status, await response.text());
    throw new Error('Could not validate credentials with TTS service');
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const requestBlocks = await request.json(); 
    const token = await getAccessToken();
    const payload = { blocks: requestBlocks };

    const jobResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store', // منع التخزين المؤقت
    });

    const jobData = await jobResponse.json();
    if (!jobResponse.ok) {
      return NextResponse.json({ error: jobData.detail || 'Failed to create TTS job' }, { status: jobResponse.status });
    }
    return NextResponse.json(jobData);
  } catch (error: any) {
    console.error("Error in /api/tts/create route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}