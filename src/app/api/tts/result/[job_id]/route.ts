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
        cache: 'no-store',
    });
    if (!response.ok) {
        throw new Error('Could not validate credentials with TTS service');
    }
    const data = await response.json();
    return data.access_token;
}

export async function GET(request: NextRequest, { params }: { params: { job_id: string } }) {
    const { job_id } = params;
    if (!job_id) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    try {
        const token = await getAccessToken();
        
        // --- === جلب الملف الصوتي مباشرة === ---
        const audioResponse = await fetch(`${process.env.TTS_API_BASE_URL}/result/${job_id}/audio`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!audioResponse.ok) {
            const errorData = await audioResponse.json();
            return NextResponse.json({ error: errorData.detail || 'Failed to fetch audio file' }, { status: audioResponse.status });
        }
        
        // --- === إرجاع الملف الصوتي للمتصفح === ---
        const audioBlob = await audioResponse.blob();
        return new NextResponse(audioBlob, {
            status: 200,
            headers: { 'Content-Type': 'audio/mpeg' },
        });

    } catch (error: any) {
        console.error("Error in /api/tts/result route:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}