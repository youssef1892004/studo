// src/app/api/voices/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const provider = process.env.TTS_PROVIDER_NAME || 'ghaymah';
    
    // --- === تم التعديل هنا: استدعاء مباشر بدون توكن === ---
    const voicesResponse = await fetch(`${process.env.TTS_API_BASE_URL}/tts/voices/${provider}`);

    if (!voicesResponse.ok) {
      const errorData = await voicesResponse.json();
      throw new Error(errorData.detail || 'Failed to fetch voices from provider');
    }

    const voicesData = await voicesResponse.json();
    
    // تنسيق البيانات لتناسب الواجهة الأمامية
    const formattedVoices = voicesData.map((voice: any) => ({
        name: voice.voice_id,       //  استخدام voice_id للطلبات
        gender: 'Not specified',
        language: voice.name,       // استخدام name للعرض
    }));

    return NextResponse.json(formattedVoices);

  } catch (error: any) {
    console.error("Error fetching voices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}