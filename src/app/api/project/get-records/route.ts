import { NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// --- S3/Wasabi Configuration ---
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;
const WASABI_ENDPOINT = "https://s3.eu-south-1.wasabisys.com";

// --- Hasura Configuration ---
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET!;

// Initialize S3 Client
const s3Client = new S3Client({
    region: AWS_REGION,
    endpoint: WASABI_ENDPOINT,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const projectId = url.searchParams.get("projectId");
        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        // 1. Fetch records from Hasura
        const query = `query GetProjectLinkStorage($projectId: uuid!) {
            libaray_Project_link_Storage(where: { projectid: { _eq: $projectId } }, order_by: { id: desc }) {
                id
                projectid
                project_link
            }
        }`;

        const res = await fetch(HASURA_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
            },
            body: JSON.stringify({ query, variables: { projectId } }),
        });

        const data = await res.json();
        if (data.errors) {
            console.error("Hasura Error:", data.errors);
            return NextResponse.json({ error: data.errors }, { status: 500 });
        }

        const records = data.data.libaray_Project_link_Storage;

        // 2. Generate pre-signed URLs for each record
        const recordsWithPlayableLinks = await Promise.all(
            records.map(async (record: { id: string; projectid: string; project_link: string }) => {
                try {
                    // Extract the object key from the full URL
                    const urlPrefix = `${WASABI_ENDPOINT}/${S3_BUCKET_NAME}/`;
                    if (!record.project_link.startsWith(urlPrefix)) {
                        throw new Error(`Invalid URL format for link: ${record.project_link}`);
                    }
                    const objectKey = record.project_link.substring(urlPrefix.length);

                    const command = new GetObjectCommand({
                        Bucket: S3_BUCKET_NAME,
                        Key: objectKey,
                    });

                    // Generate a pre-signed URL valid for 1 hour
                    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

                    return {
                        ...record,
                        project_link: signedUrl, // Replace with the playable URL
                    };
                } catch (presignError) {
                    console.error(`Failed to pre-sign URL for ${record.project_link}:`, presignError);
                    // Return the original record with a specific error message
                    return {
                        ...record,
                        project_link: null, // Set link to null to prevent rendering a broken player
                        error: (presignError instanceof Error) ? presignError.message : 'Failed to generate playable link'
                    };
                }
            })
        );

        return NextResponse.json(recordsWithPlayableLinks);

    } catch (err) {
        console.error("GET /api/project/get-records error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}