// src/app/api/tts/preview/route.ts
import { NextRequest, NextResponse } from 'next/server';

// --- Helper function to get the access token ---
async function getAccessToken() {
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
  if (!response.ok) throw new Error('Could not validate credentials with TTS service');
  const data = await response.json();
  return data.access_token;
}

// --- Main POST function for the preview endpoint ---
export async function POST(request: NextRequest) {
  try {
    const { voice } = await request.json();
    if (!voice) {
      return NextResponse.json({ error: 'Voice name is required' }, { status: 400 });
    }

    const token = await getAccessToken();
    const previewText = "أهلاً بك، يمكنك الآن الاستماع إلى صوتي لتجربته.";
    
    const payload = {
      blocks: [{
        text: previewText,
        provider: "ghaymah",
        voice: voice,
      }]
    };

    // 1. Create the job
    const jobResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const jobData = await jobResponse.json();
    if (!jobResponse.ok) throw new Error(jobData.detail || 'Failed to create TTS job');
    
    const { job_id } = jobData;

    // 2. Poll for status until completed or failed
    let status = '';
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds
      const statusResponse = await fetch(`${process.env.TTS_API_BASE_URL}/status/${job_id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      const statusData = await statusResponse.json();
      status = statusData.status;
    }

    if (status === 'failed') throw new Error('Preview generation failed');

    // 3. Fetch the result and return as audio blob
    const audioResponse = await fetch(`${process.env.TTS_API_BASE_URL}/result/${job_id}/audio`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!audioResponse.ok) throw new Error('Failed to fetch preview audio file');

    const audioBlob = await audioResponse.blob();
    return new NextResponse(audioBlob, {
        status: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
    });

  } catch (error: any) {
    console.error("Error in /api/tts/preview route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}