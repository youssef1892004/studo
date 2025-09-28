// src/app/api/tts/generate-segment/route.ts

import { NextRequest, NextResponse } from 'next/server';

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
    // (تعديل) استقبال الـ flag الجديد
    const { text, voice, isArabic } = await request.json(); 
    if (!text || !voice) {
      return NextResponse.json({ error: 'Text and voice are required' }, { status: 400 });
    }

    const token = await getAccessToken();
    
    // (تعديل) تحديد المزود والـ payload بناءً على isArabic
    const provider = isArabic ? "ghaymah_pro" : "ghaymah";

    // (تعديل جديد) إذا كان المزود هو ghaymah_pro (للتشكيل)، يجب أن نستخدم Voice ID صحيح.
    let finalVoice = voice;
    if (isArabic) {
        // إذا كان تفعيل التشكيل، يجب أن تكون قيمة الصوت '0' أو '1' إلخ.
        // نتحقق ما إذا كان Voice ID الحالي هو نصي مثل "ar-EG-SalmaNeural"
        if (voice.includes('-') || isNaN(parseInt(voice, 10))) {
            // إذا كان Voice ID قديماً، نستخدم '0' كقيمة افتراضية للـ ghaymah_pro
            finalVoice = '0';
        }
    }
    
    const blockPayload = { 
        text, 
        provider, 
        voice: finalVoice, // استخدام finalVoice
        // إضافة الخصائص المطلوبة للتشكيل، مع wait_after_ms: 0 كقيمة ثابتة
        ...(isArabic && { arabic: true, wait_after_ms: 0 }) 
    };

    const payload = { blocks: [blockPayload] };

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
        // محاولة قراءة الخطأ كـ JSON أو كنص
        try {
            return NextResponse.json({ error: jobData.detail || 'Failed to create TTS job' }, { status: jobResponse.status });
        } catch (e) {
            return NextResponse.json({ error: await jobResponse.text() || 'Failed to create TTS job' }, { status: jobResponse.status });
        }
    }

    // 2. إرجاع بيانات المهمة مباشرة للمتصفح
    return NextResponse.json(jobData);

  } catch (error: any) {
    console.error("Error in /api/tts/generate-segment route:", error.message);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}