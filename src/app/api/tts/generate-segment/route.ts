import { NextRequest, NextResponse } from 'next/server';

// دالة مساعدة للحصول على توكن الوصول
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
  if (!response.ok) {
      const errorBody = await response.text();
      console.error("TTS Token Auth Failed:", errorBody);
      throw new Error('Could not validate credentials with TTS service');
  }
  const data = await response.json();
  return data.access_token;
}

// --- (تعديل جذري) هذه الدالة ستقوم فقط بإنشاء المهمة وإعادة رقمها فورًا ---
export async function POST(request: NextRequest) {
  try {
    const { text, voice } = await request.json();
    if (!text || !voice) {
      return NextResponse.json({ error: 'Text and voice are required' }, { status: 400 });
    }

    const token = await getAccessToken();
    const payload = { blocks: [{ text, provider: "ghaymah", voice }] };

    // 1. إنشاء المهمة وإعادة رقمها فورًا
    const jobResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    
    const jobData = await jobResponse.json();
    if (!jobResponse.ok) {
        console.error("Error creating TTS job on external service:", jobData);
        throw new Error(jobData.detail || 'Failed to create TTS job');
    }

    // 2. إرجاع بيانات المهمة مباشرة للمتصفح
    return NextResponse.json(jobData);

  } catch (error: any) {
    console.error("Error in /api/tts/generate-segment route:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}