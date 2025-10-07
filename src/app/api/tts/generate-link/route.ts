// src/app/api/tts/generate-link/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// --- (1) تهيئة AWS S3 و Hasura ---
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME; // voicestudio
const AWS_REGION = process.env.AWS_REGION;             // eu-south-1
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});

// دالة وهمية لتمثيل جلب ملف الصوت كـ Buffer
async function mockFetchAudio(voice: string): Promise<Buffer> {
    // نستخدم ملف صوتي موجود لغرض المحاكاة
    const audioPath = path.join(process.cwd(), 'public/generated_audio/3.mp3'); 
    
    if (!fs.existsSync(audioPath)) {
        throw new Error("Mock audio file not found. Please ensure public/generated_audio/3.mp3 exists.");
    }
    
    return fs.promises.readFile(audioPath);
}

// دالة لحفظ الرابط في Hasura
async function saveLinkToHasura(projectId: string, s3Url: string): Promise<string> {
    if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
        throw new Error("Hasura environment variables not configured.");
    }

    const mutation = `
        mutation InsertProjectLink($projectId: uuid!, $link: String!) {
            insert_libaray_Project_link_Storage_one(
                object: { projectid: $projectId, project_link: $link }
            ) {
                id
            }
        }
    `;

    const response = await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { projectId, link: s3Url },
        }),
    });

    const data = await response.json();
    if (data.errors) {
        console.error("Hasura Error:", data.errors);
        throw new Error(data.errors[0].message || "Failed to insert link into Hasura.");
    }
    
    return data.data.insert_libaray_Project_link_Storage_one.id;
}


// --- (2) دالة POST الرئيسية ---
export async function POST(request: NextRequest) {
    try {
        const { projectId, text, voice } = await request.json();

        if (!projectId || !text || !voice) {
            return NextResponse.json({ error: 'Missing required parameters: projectId, text, and voice.' }, { status: 400 });
        }

        if (!S3_BUCKET_NAME || !AWS_REGION) {
             return NextResponse.json({ error: 'AWS S3 environment variables not configured.' }, { status: 500 });
        }

        // 1. توليد الملف الصوتي (Mocked for now)
        const audioBuffer = await mockFetchAudio(voice);

        // 2. رفع الملف إلى S3
        const objectKey = `generated_audio/${projectId}/${uuidv4()}.mp3`;
        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: objectKey,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        };
        
        await s3Client.send(new PutObjectCommand(uploadParams));

        // إنشاء الرابط العام لملف S3
        const s3Url = `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${objectKey}`;

        // 3. حفظ الرابط في Hasura
        const linkId = await saveLinkToHasura(projectId, s3Url);

        // 4. إرجاع النتيجة
        return NextResponse.json({ 
            s3Url, 
            linkId,
            message: "Audio generated and link saved successfully." 
        }, { status: 200 });

    } catch (error: any) {
        console.error("CRITICAL ERROR in generate-link route:", error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}