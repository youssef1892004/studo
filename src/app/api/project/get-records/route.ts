import { NextResponse } from "next/server";

 const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL!;
 const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET!;

 export async function GET(req: Request) {
   try {
     const url = new URL(req.url);
     const projectId = url.searchParams.get("projectId");
     if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

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
         "x-hasura-admin-secret": HASURA_ADMIN_SECRET
       },
       body: JSON.stringify({ query, variables: { projectId } })
     });

     const data = await res.json();
     if (data.errors) {
       return NextResponse.json({ error: data.errors }, { status: 500 });
     }
     return NextResponse.json(data.data.libaray_Project_link_Storage);
   } catch (err) {
     console.error("GET /api/project/get-records error:", err);
     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
   }
 }
