// src/app/api/tts/generate-segment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import getMP3Duration from 'get-mp3-duration';

// --- Helper function to get the access token ---
async function getAccessToken() {
  // ... (نفس دالة getAccessToken الموجودة في ملفات API الأخرى)
  if (!process.env.TTS_API_BASE_URL || !process.env.TTS_API_USERNAME || !process.env.TTS_API_PASSWORD) {
    throw new Error("TTS Service environment variables are not configured");
  }
  const response = await fetch(`${process.env.TTS_API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      username: process.env.TTS_API_USERNAME,
      password: process.env.TTS_API_PASSWORD,
    }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Could not validate credentials');
  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json();
    if (!text || !voice) {
      return NextResponse.json({ error: 'Text and voice are required' }, { status: 400 });
    }

    const token = await getAccessToken();
    const payload = { blocks: [{ text, provider: "ghaymah", voice }] };

    // 1. Create Job
    const jobResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const jobData = await jobResponse.json();
    if (!jobResponse.ok) throw new Error(jobData.detail || 'Failed to create TTS job');
    const { job_id } = jobData;

    // 2. Poll for status
    let status = '';
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const statusResponse = await fetch(`${process.env.TTS_API_BASE_URL}/status/${job_id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      const statusData = await statusResponse.json();
      status = statusData.status;
    }

    if (status === 'failed') throw new Error('Segment generation failed');

    // 3. Fetch result audio
    const audioResponse = await fetch(`${process.env.TTS_API_BASE_URL}/result/${job_id}/audio`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!audioResponse.ok) throw new Error('Failed to fetch audio file');

    const audioBuffer = await audioResponse.arrayBuffer();
    const duration = getMP3Duration(Buffer.from(audioBuffer));

    // 4. Return audio blob with duration in header
    return new NextResponse(audioBuffer, {
        status: 200,
        headers: { 
            'Content-Type': 'audio/mpeg',
            'X-Audio-Duration': (duration / 1000).toString() // تحويل من ميلي ثانية إلى ثانية
        },
    });

  } catch (error: any) {
    console.error("Error in /api/tts/generate-segment route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}