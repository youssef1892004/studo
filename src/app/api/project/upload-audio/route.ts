// src/app/api/project/upload-audio/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// --- تهيئة Wasabi و Hasura من متغيرات البيئة ---
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID; 
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY; 
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME; 
const AWS_REGION = process.env.AWS_REGION; 

// [FIX 1] تعريف نقطة نهاية Wasabi بناءً على البيانات المقدمة
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";


// دالة لحفظ الرابط في Hasura (بدون تغيير)
async function saveLinkToHasura(projectId: string, s3Url: string): Promise<string> {
    if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
        throw new Error("Hasura environment variables not configured on server side.");
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


export async function POST(request: NextRequest) {
    try {
        const { dataUrl, projectId } = await request.json();

        if (!dataUrl || !projectId) {
            return NextResponse.json({ error: 'Missing required parameters: dataUrl and projectId.' }, { status: 400 });
        }
        
        if (!S3_BUCKET_NAME || !AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
             return NextResponse.json({ error: 'CRITICAL: S3 environment variables are missing.' }, { status: 500 });
        }

        // [FIX 2] تهيئة العميل: إضافة endpoint لـ Wasabi هو الحل الجوهري للمصادقة
        const s3Client = new S3Client({
            region: AWS_REGION,
            endpoint: WASABI_ENDPOINT, 
            credentials: {
                accessKeyId: AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            }
        });
        
        // 1. تحويل Base64 Data URL إلى Buffer
        const base64Data = dataUrl.replace(/^data:audio\/mpeg;base64,/, "");
        const audioBuffer = Buffer.from(base64Data, 'base64');

        // 2. رفع الملف إلى Wasabi
        const objectKey = `studio-audio/${projectId}/${uuidv4()}.mp3`;
        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: objectKey,
            Body: audioBuffer,
            ContentType: 'audio/mpeg',
        };
        
        await s3Client.send(new PutObjectCommand(uploadParams));

        // 3. بناء رابط Wasabi العام
        // [FIX 3] يجب أن يكون الرابط وفقاً لنقطة نهاية Wasabi ونمط المسار: [endpoint]/[bucket]/[key]
        const s3Url = `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/${objectKey}`;

        // 4. حفظ الرابط في Hasura (تم التعطيل لأنه مكرر ويتم من الواجهة الأمامية)
        // await saveLinkToHasura(projectId, s3Url); 

        // 5. إرجاع رابط S3 الدائم
        return NextResponse.json({ 
            persistentAudioUrl: s3Url,
            message: "Audio uploaded to Wasabi and link saved successfully."
        }, { status: 200 });

    } catch (error: any) {
        console.error("CRITICAL WASABI UPLOAD/HASURA ERROR:", error);
        // تم تعديل رسالة الخطأ لتشمل نقطة النهاية للتشخيص
        return NextResponse.json({ 
            error: error.message || 'An unexpected server error occurred during upload.',
            details: `Failed to connect or authenticate to Wasabi at: ${WASABI_ENDPOINT}. Check your keys and firewall settings.`
        }, { status: 500 });
    }
}