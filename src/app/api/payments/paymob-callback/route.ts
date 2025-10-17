// src/app/api/payments/paymob-callback/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { obj } = body;

    // الخطوة 1: استخراج HMAC من الرابط
    const url = new URL(req.url);
    const hmacFromPaymob = url.searchParams.get('hmac');
    if (!hmacFromPaymob) {
        console.warn('Callback received without HMAC parameter.');
        return NextResponse.json({ message: 'HMAC not found' }, { status: 400 });
    }
    
    // الخطوة 2: تجميع البيانات للتحقق من التوقيع
    const concatenatedString = `${obj.amount_cents}${obj.created_at}${obj.currency}${obj.error_occured}${obj.has_parent_transaction}${obj.id}${obj.integration_id}${obj.is_3d_secure}${obj.is_auth}${obj.is_capture}${obj.is_refunded}${obj.is_standalone_payment}${obj.is_voided}${obj.order.id}${obj.owner}${obj.pending}${obj.source_data.pan}${obj.source_data.sub_type}${obj.source_data.type}${obj.success}`;

    // الخطوة 3: تشفير البيانات
    const calculatedHmac = crypto
      .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET!)
      .update(concatenatedString)
      .digest('hex');

    // الخطوة 4: مقارنة التوقيعين
    if (calculatedHmac !== hmacFromPaymob) {
      console.error('HMAC verification failed! The request might be tampered with.');
      return NextResponse.json({ message: 'HMAC verification failed' }, { status: 401 });
    }

    // =================================================================
    // تم التحقق بنجاح - تحديث قاعدة البيانات
    // =================================================================
    
    const isSuccess = obj.success;
    const orderId = obj.order.id; // paymob_order_id
    const transactionId = obj.id; // paymob_transaction_id
    const newStatus = isSuccess ? "successful" : "failed";

    // 1. تحديث جدول "payments"
    const UPDATE_PAYMENT = `
      mutation UpdatePayment($orderId: bigint!, $status: String!, $transactionId: bigint) {
        update_payments(
          where: { paymob_order_id: { _eq: $orderId } },
          _set: { 
            status: $status, 
            paymob_transaction_id: $transactionId 
          }
        ) {
          returning {
            id
            user_id
            plan_id
          }
        }
      }
    `;

    const hasuraResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
        },
        body: JSON.stringify({
            query: UPDATE_PAYMENT,
            variables: {
                orderId: orderId,
                status: newStatus,
                transactionId: transactionId,
            },
        }),
    });
    const hasuraResult = await hasuraResponse.json();

    if (hasuraResult.errors) {
        console.error("Failed to update payment in Hasura:", hasuraResult.errors);
        // لا نرجع خطأ 500 هنا، لنمنع Paymob من إعادة الإرسال
    }

    // 2. تفعيل الاشتراك إذا نجح الدفع
    if (isSuccess && hasuraResult.data?.update_payments?.returning[0]) {
        const payment = hasuraResult.data.update_payments.returning[0];
        const paidUserId = payment.user_id;
        const paidPlanId = payment.plan_id;

        // 2أ. جلب تفاصيل الخطة (max_chars)
        const GET_PLAN_DETAILS = `
          query GetPlanDetails($planId: uuid!) {
            Voice_Studio_Plans_by_pk(id: $planId) {
              max_chars
            }
          }
        `;
        const planResponse = await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
            },
            body: JSON.stringify({
                query: GET_PLAN_DETAILS,
                variables: { planId: paidPlanId }
            }),
        });
        const planData = await planResponse.json();
        const maxChars = planData.data.Voice_Studio_Plans_by_pk.max_chars;

        // 2ب. حساب تواريخ الاشتراك (مثال: 30 يوم)
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // 2ج. تفعيل الاشتراك (Upsert: تحديث أو إنشاء)
        const ACTIVATE_SUBSCRIPTION = `
          mutation ActivateSubscription($userId: String!, $planId: uuid!, $startDate: timestamptz!, $endDate: timestamptz!, $maxChars: Int!) {
            insert_Voice_Studio_subscriptions(
              objects: {
                user_id: $userId,
                plan_id: $planId,
                start_date: $startDate,
                end_date: $endDate,
                remaining_chars: $maxChars,
                active: true,
                auto_renew: false
              },
              on_conflict: {
                constraint: Voice_Studio_subscriptions_user_id_key, // TODO: تأكد أن هذا هو اسم القيد الصحيح
                update_columns: [plan_id, start_date, end_date, remaining_chars, active]
              }
            ) {
              returning { id }
            }
          }
        `;
        
        await fetch(process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET!,
            },
            body: JSON.stringify({
                query: ACTIVATE_SUBSCRIPTION,
                variables: {
                    userId: paidUserId,
                    planId: paidPlanId,
                    startDate: startDate,
                    endDate: endDate,
                    maxChars: maxChars,
                },
            }),
        });

        console.log(`Subscription activated for user ${paidUserId} on plan ${paidPlanId}`);
    }

    // الخطوة 5: إرسال استجابة 200 OK لإعلام Paymob
    return NextResponse.json({ message: 'Callback received and processed' }, { status: 200 });

  } catch (error) {
    console.error('Callback processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}