// src/app/api/register/route.ts
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
    console.error("Server configuration error: Hasura environment variables are missing.");
    return jsonResponse({ message: 'خطأ في إعدادات الخادم.' }, 500);
  }

  try {
    const body = await request.json();
    const { displayName, email, password } = body;

    if (!displayName || !email || !password) {
      return jsonResponse({ message: 'الرجاء ملء جميع الحقول.' }, 400);
    }

    if (password.length < 6) {
        return jsonResponse({ message: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.' }, 400);
    }

    const password_hash = await bcrypt.hash(password, 10);

    // --- (تصحيح) تم استخدام اسم الميوتيشن الصحيح "insertUser" ---
    const INSERT_USER_MUTATION = `
      mutation insertUser($object: users_insert_input!) {
        insertUser(object: $object) {
          id
          email
          displayName
        }
      }
    `;

    const variables = {
      object: {
        displayName: displayName,
        email: email,
        passwordHash: password_hash,
        locale: "ar",
        roles: {
          data: [{ role: "user" }]
        }
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
        console.error("Hasura Error:", hasuraData.errors);
        throw new Error(hasuraData.errors[0].message);
    }

    if (!hasuraData.data || !hasuraData.data.insertUser) {
        console.error("Unexpected Hasura response:", hasuraData);
        throw new Error("Failed to create user in the database.");
    }

    // --- (تصحيح) قراءة الاستجابة الصحيحة "insertUser" ---
    return jsonResponse(hasuraData.data.insertUser, 201);

  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return jsonResponse({ message: error.message || 'An unexpected error occurred' }, 500);
  }
}