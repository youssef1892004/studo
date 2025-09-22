import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

function jsonResponse(data: any, status: number) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.HASURA_GRAPHQL_URL || !process.env.HASURA_ADMIN_SECRET) {
    return jsonResponse({ message: 'خطأ في إعدادات الخادم.' }, 500);
  }

  try {
    const body = await request.json();
    const { displayName, email, password } = body;

    if (!displayName || !email || !password) {
      return jsonResponse({ message: 'الرجاء ملء جميع الحقول.' }, 400);
    }

    const password_hash = await bcrypt.hash(password, 10);

    const INSERT_USER_MUTATION = `
      mutation insertUser($object: users_insert_input!) {
        insert_users_one(object: $object) { id email displayName }
      }
    `;

    const variables = {
      object: {
        displayName: displayName,
        email: email,
        passwordHash: password_hash,
        locale: 'ar',
        roles: { data: { role: "user" } }
      }
    };

    const hasuraResponse = await fetch(process.env.HASURA_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query: INSERT_USER_MUTATION, variables: variables })
    });

    const hasuraData = await hasuraResponse.json();
    if (hasuraData.errors) {
        if (hasuraData.errors[0]?.extensions?.code === 'constraint-violation') {
             throw new Error('هذا البريد الإلكتروني مسجل بالفعل.');
        }
        throw new Error(hasuraData.errors[0].message);
    }

    return jsonResponse(hasuraData.data.insert_users_one, 201);
  } catch (error: any) {
    return jsonResponse({ message: error.message || 'An unexpected error occurred' }, 500);
  }
}