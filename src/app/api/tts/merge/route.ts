// File path: src/app/api/tts/merge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { TTSRequestItem } from '../../../../lib/types';

const execFilePromise = promisify(execFile);

// --- Dynamic Path Resolution for ffmpeg ---
const isDev = process.env.NODE_ENV === 'development';
const ffmpegPath = isDev 
  ? ffmpegStatic
  : path.join(process.cwd(), '.next/server/vendor-chunks/ffmpeg.exe');


async function generateSingleSpeech(item: TTSRequestItem, apiKey: string, baseUrl: string): Promise<Buffer> {
    const response = await fetch(`${baseUrl}/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'tts-1', input: item.text, voice: item.voice }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate speech for: ${item.text}. Reason: ${errorText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export async function POST(req: NextRequest) {
  let tempDir: string | undefined;
  try {
    const items: TTSRequestItem[] = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Invalid request body' }), { status: 400 });
    }

    const apiKey = process.env.API_KEY;
    const baseUrl = process.env.API_BASE_URL;

    if (!apiKey || !baseUrl) {
      return new NextResponse(JSON.stringify({ error: 'API key or base URL is not configured' }), { status: 500 });
    }

    tempDir = path.join(os.tmpdir(), `tts-merge-${uuidv4()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const fileList: string[] = [];

    // We no longer need to calculate duration on the server
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.text.trim()) continue;
      try {
        const audioBuffer = await generateSingleSpeech(item, apiKey, baseUrl);
        if (audioBuffer.length > 0) {
          const fileName = `audio-${i}.mp3`;
          const filePath = path.join(tempDir, fileName);
          await fs.writeFile(filePath, audioBuffer);
          fileList.push(`file '${fileName}'`);
        }
      } catch (err) {
        console.error(`Error processing item ${i} ("${item.text}"):`, err);
      }
    }

    if (fileList.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No valid audio could be generated.' }), { status: 400 });
    }
    
    const fileListPath = path.join(tempDir, 'filelist.txt');
    await fs.writeFile(fileListPath, fileList.join('\n'));
    
    const outputPath = path.join(tempDir, 'merged.mp3');

    if (!ffmpegPath) {
        throw new Error("ffmpeg path is not configured.");
    }
    
    const mergeArgs = [
        '-f', 'concat',
        '-safe', '0',
        '-i', fileListPath,
        '-c', 'copy',
        outputPath
    ];
    // Set the working directory for ffmpeg to the temp directory
    await execFilePromise(ffmpegPath, mergeArgs, { cwd: tempDir }); 
    
    const mergedAudioBuffer = await fs.readFile(outputPath);
    
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    
    // We are now sending the raw audio blob back
    return new Response(mergedAudioBuffer as any, { headers });

  } catch (error: any) {
    console.error('[FATAL] Error during TTS merge process:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500 });
  } finally {
     if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(err => {
            console.error(`[ERROR] Failed to cleanup temp directory ${tempDir}:`, err);
        });
    }
  }
}