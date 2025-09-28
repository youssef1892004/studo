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
        console.error("Authentication failed with TTS service. Status:", response.status, await response.text());
        throw new Error('Could not validate credentials with TTS service');
    }
    const data = await response.json();
    return data.access_token;
}

// --- === تم إصلاح المشكلة هنا === ---
// تم تصحيح تعريف "params"
export async function GET(request: NextRequest, { params }: { params: { job_id: string } }) {
    const { job_id } = params;
    if (!job_id) {
        return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    try {
        const token = await getAccessToken();
        const statusResponse = await fetch(`${process.env.TTS_API_BASE_URL}/status/${job_id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store',
        });

        const statusData = await statusResponse.json();
        if (!statusResponse.ok) {
            return NextResponse.json({ error: statusData.detail || 'Failed to get job status' }, { status: statusResponse.status });
        }
        
        return NextResponse.json(statusData);

    } catch (error: any) {
        console.error("Error in /api/tts/status route:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}