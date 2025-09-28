// src/lib/graphql.ts

import { TTSCardData } from "./types";
import { v4 as uuidv4 } from 'uuid';

const HASURA_GRAPHQL_URL = process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function fetchGraphQL<T>(query: string, variables: Record<string, any>): Promise<GraphQLResponse<T>> {
  if (!HASURA_GRAPHQL_URL || !HASURA_ADMIN_SECRET) {
    throw new Error("Hasura environment variables (NEXT_PUBLIC_...) are not configured in .env.local. Please check the file and restart the server.");
  }
  
  const response = await fetch(HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Network error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

interface Project {
  id: string;
  userid: string;
  comments: string;
  last_updated: string;
  blocks: TTSCardData[];
}

// دالة لجلب المشاريع
export const getProjectsByUserId = async (userId: string): Promise<Project[]> => {
  const query = `
    query GetProjects($userId: uuid!) {
      libaray_Projects(where: {userid: {_eq: $userId}}, order_by: {last_updated: desc}) {
        id
        userid
        comments
        last_updated
        blocks
      }
    }
  `;
  const response = await fetchGraphQL<{ libaray_Projects: Project[] }>(query, { userId });
  if (response.errors) throw new Error(response.errors[0].message);
  // Hasura will return 'blocks' as a JSON object directly, no need to parse
  return response.data?.libaray_Projects || [];
};

// دالة لإنشاء مشروع جديد
export const insertProject = async (userId: string, title: string): Promise<Project> => {
    // FIX: Changed variable type for $blocks from String! to jsonb!
    const mutation = `
      mutation InsertProject($userid: uuid!, $comments: String, $last_updated: timestamptz!, $blocks: jsonb!) {
        insert_libaray_Projects_one(object: {userid: $userid, comments: $comments, last_updated: $last_updated, blocks: $blocks}) {
          id
          comments
          last_updated
          blocks
        }
      }
    `;
    const defaultBlock: TTSCardData = {
        id: uuidv4(),
        voice: 'ar-SA-HamedNeural',
        data: { time: Date.now(), blocks: [{ id: uuidv4(), type: 'paragraph', data: { text: `مرحبًا بك في مشروعك الجديد "${title}"` } }] },
    };
    const variables = {
      userid: userId,
      comments: title,
      last_updated: new Date().toISOString(),
      // FIX: Pass the blocks array directly as a JSON object, not a string
      blocks: [defaultBlock],
    };
    const response = await fetchGraphQL<{ insert_libaray_Projects_one: Project }>(mutation, variables);
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data!.insert_libaray_Projects_one;
};

// دالة لجلب مشروع معين
export const getProjectById = async (projectId: string): Promise<Project | null> => {
    const query = `
      query GetProjectById($id: uuid!) {
        libaray_Projects_by_pk(id: $id) {
          id, userid, comments, last_updated, blocks
        }
      }
    `;
    const response = await fetchGraphQL<{ libaray_Projects_by_pk: Project }>(query, { id: projectId });
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data?.libaray_Projects_by_pk || null;
}

// دالة لتحديث مشروع حالي
export const updateProject = async (projectId: string, cards: TTSCardData[], title: string) => {
    // FIX: Changed variable type for $blocks from String! to jsonb!
    const mutation = `
        mutation UpdateProject($id: uuid!, $blocks: jsonb!, $comments: String, $last_updated: timestamptz!) {
            update_libaray_Projects_by_pk(pk_columns: {id: $id}, _set: {blocks: $blocks, comments: $comments, last_updated: $last_updated}) {
                id
            }
        }
    `;
    const variables = { 
        id: projectId, 
        // FIX: Pass the blocks array directly as a JSON object
        blocks: cards, 
        comments: title, 
        last_updated: new Date().toISOString() 
    };
    const response = await fetchGraphQL(mutation, variables);
    if (response.errors) throw new Error(response.errors[0].message);
    return response.data;
}
// --- (جديد) دالة لحذف مشروع ---
export const deleteProject = async (projectId: string): Promise<{ id: string }> => {
    const mutation = `
        mutation DeleteProject($id: uuid!) {
            delete_libaray_Projects_by_pk(id: $id) {
                id
            }
        }
    `;
    const variables = { id: projectId };
    const response = await fetchGraphQL<{ delete_libaray_Projects_by_pk: { id: string } }>(mutation, variables);
    if (response.errors) {
        throw new Error(response.errors[0].message);
    }
    if (!response.data?.delete_libaray_Projects_by_pk) {
        throw new Error("Project not found or could not be deleted.");
    }
    return response.data.delete_libaray_Projects_by_pk;
};