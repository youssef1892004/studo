import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { text, voice } = await req.json();

  if (!text || !voice) {
    return NextResponse.json({ error: 'Text and voice are required' }, { status: 400 });
  }

  const apiKey = process.env.API_KEY;
  const baseUrl = process.env.API_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: 'API key or base URL is not configured' }, { status: 500 });
  }

  try {
    const externalApiResponse = await fetch(`${baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
      }),
    });

    if (!externalApiResponse.ok) {
      const errorBody = await externalApiResponse.text();
      return new Response(errorBody, {
        status: externalApiResponse.status,
        statusText: externalApiResponse.statusText,
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', externalApiResponse.headers.get('Content-Type') || 'audio/mpeg');

    return new Response(externalApiResponse.body, {
      status: 200,
      statusText: 'OK',
      headers: headers,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}