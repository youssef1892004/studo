import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import ffmpegStatic from 'ffmpeg-static';
import { v4 as uuidv4 } from 'uuid';
import { execFile } from 'child_process';
import { promisify } from 'util';
import getMp3Duration from 'get-mp3-duration';
import { TTSRequestItem, Segment } from '../../../../lib/types';

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
    const segments: Segment[] = [];
    const errors: string[] = [];

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

          const durationInMs = getMp3Duration(audioBuffer);
          segments.push({ id: item.id, duration: durationInMs / 1000 });
        }
      } catch (err: any) {
        console.error(`Error processing item ${i} ("${item.text}"):`, err);
        errors.push(err.message);
      }
    }

    if (fileList.length === 0) {
      const errorMessage = errors.length > 0 ? `All TTS requests failed. Errors: ${errors.join(', ')}` : 'No valid audio could be generated.';
      return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 400 });
    }
    
    const fileListPath = path.join(tempDir, 'filelist.txt');
    await fs.writeFile(fileListPath, fileList.join('\n'));
    
    const mergedFileName = `merged-${uuidv4()}.mp3`;
    const outputPath = path.join(tempDir, mergedFileName);

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
    await execFilePromise(ffmpegPath, mergeArgs, { cwd: tempDir }); 
    
    const mergedAudioBuffer = await fs.readFile(outputPath);

    // Save the merged file to a public directory to be served
    const publicDir = path.join(process.cwd(), 'public', 'generated_audio');
    await fs.mkdir(publicDir, { recursive: true });
    const publicFilePath = path.join(publicDir, mergedFileName);
    await fs.writeFile(publicFilePath, mergedAudioBuffer);

    const audioUrl = `/generated_audio/${mergedFileName}`;
    
    return NextResponse.json({ audioUrl, segments });

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
