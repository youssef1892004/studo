// File path: src/app/api/auth/token/route.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { HasuraUser } from '@/lib/types'; // استيراد النوع الصحيح

function jsonResponse(data: any, status: number) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getUserByEmail(email: string): Promise<HasuraUser | undefined> {
  const GET_USER_QUERY = `
    query GetUser($email: citext!) {
      users(where: {email: {_eq: $email}}) {
        id
        displayName
        email
        passwordHash
        roles { role }
      }
    }
  `;
  const response = await fetch(process.env.HASURA_GRAPHQL_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
    },
    body: JSON.stringify({ query: GET_USER_QUERY, variables: { email } }),
  });
  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  return data.data?.users[0];
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonResponse({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان.' }, 400);
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return jsonResponse({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return jsonResponse({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, 401);
    }
    
    const jwtSecretObject = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET!);
    if (!jwtSecretObject || !jwtSecretObject.key) {
        throw new Error("JWT Secret Key is not configured correctly.");
    }

    const userRoles = Array.isArray(user.roles) ? user.roles.map(r => r.role) : [];
    const allowedRoles = ['user', ...userRoles];
    const defaultRole = userRoles.length > 0 ? userRoles[0] : "user";
    
    const claims = {
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": allowedRoles,
        "x-hasura-default-role": defaultRole,
        "x-hasura-user-id": user.id.toString(),
      },
      iat: Math.floor(Date.now() / 1000) - 30,
    };

    const token = jwt.sign(claims, jwtSecretObject.key, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });

    return jsonResponse({
      accessToken: token,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        roles: allowedRoles
      }
    }, 200);

  } catch (error: any) {
    console.error("Error in token generation route:", error);
    return jsonResponse({ message: error.message || 'An unexpected error occurred' }, 500);
  }
}

