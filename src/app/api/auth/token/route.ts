// File path: src/app/api/auth/token/route.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { HasuraUser } from '@/lib/types';

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
    // 1. التحقق من وجود متغيرات البيئة الأساسية
    if (!process.env.HASURA_GRAPHQL_URL || !process.env.HASURA_ADMIN_SECRET || !process.env.HASURA_GRAPHQL_JWT_SECRET) {
        console.error("FATAL: Missing Hasura environment variables in .env.local");
        return jsonResponse({ message: 'خطأ في إعدادات الخادم.' }, 500);
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonResponse({ message: 'البريد الإلكتروني وكلمة المرور مطلوبان.' }, 400);
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return jsonResponse({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, 401);
    }
    
    // 2. التحقق المفصل من بيانات المستخدم القادمة من قاعدة البيانات
    if (!user.id) {
        console.error("DATABASE ERROR: User found but is missing an ID.", user);
        return jsonResponse({ message: 'بيانات المستخدم غير مكتملة (ID مفقود).' }, 500);
    }
    if (!user.passwordHash) {
        console.error("DATABASE ERROR: User found but is missing a password hash.", user);
        return jsonResponse({ message: 'بيانات المستخدم غير مكتملة (كلمة المرور مفقودة).' }, 500);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return jsonResponse({ message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' }, 401);
    }
    
    let jwtSecretObject;
    try {
        jwtSecretObject = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET);
    } catch (e) {
        console.error("Error parsing HASURA_GRAPHQL_JWT_SECRET:", e);
        return jsonResponse({ message: 'خطأ في إعدادات JWT Secret بالخادم.' }, 500);
    }

    if (!jwtSecretObject || !jwtSecretObject.key) {
        console.error("HASURA_GRAPHQL_JWT_SECRET is missing the 'key' property.");
        return jsonResponse({ message: "إعدادات JWT Secret بالخادم غير مكتملة." }, 500);
    }

    const userRoles = Array.isArray(user.roles) ? user.roles.map(r => r.role) : [];
    const allowedRoles = ['user', ...userRoles];
    const defaultRole = userRoles.length > 0 ? userRoles[0] : "user";
    
    const claims = {
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": allowedRoles,
        "x-hasura-default-role": defaultRole,
        "x-hasura-user-id": user.id, // استخدام user.id مباشرة
      },
      iat: Math.floor(Date.now() / 1000) - 30,
    };

    const token = jwt.sign(claims, jwtSecretObject.key, {
      algorithm: 'HS256',
      expiresIn: '1d',
    });

    return jsonResponse({
      accessToken: token,
      user: { id: user.id, displayName: user.displayName, email: user.email, roles: allowedRoles }
    }, 200);

  } catch (error: any) {
    console.error("CRITICAL ERROR in token generation route:", error);
    return jsonResponse({ message: error.message || 'An unexpected error occurred' }, 500);
  }
}