import { Voice } from './types';

export async function fetchVoices(): Promise<Voice[]> {
  const response = await fetch('/api/voices');
  if (!response.ok) {
    throw new Error('Failed to fetch voices');
  }
  return response.json();
}

export async function generateSpeech(text: string, voice: string): Promise<Blob> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to generate speech');
  }

  return response.blob();
}