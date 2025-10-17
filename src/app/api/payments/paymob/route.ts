// src/app/api/payments/paymob/route.ts
import { NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

interface DecodedToken {
    sub: string;
    // Add other properties from your JWT payload here if needed
}

async function getUserIdFromSession(req: Request): Promise<string | null> {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error("No authorization header or malformed header");
            return null;
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error("No token found in authorization header");
            return null;
        }

        // CRITICAL FIX: Use the correct Hasura JWT secret for verification
        const jwtSecret = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET!);
        if (!jwtSecret || !jwtSecret.key) {
            console.error("HASURA_GRAPHQL_JWT_SECRET is not configured correctly.");
            return null;
        }

        const decoded = jwt.verify(token, jwtSecret.key) as any;
        
        const userId = decoded?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'];

        if (!userId) {
            console.error("Token is invalid or does not contain a Hasura user ID claim.");
            return null;
        }

        return userId;

    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}


export async function POST(req: Request) {
  try {
    const { amount_cents, currency, items, billing_data, plan_id, payment_method } = await req.json();

    if (!amount_cents || !items || !billing_data || !plan_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = await getUserIdFromSession(req);
    if (!userId) {
        return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
    }

    // =================================================================
    // Step 1: Authentication Request
    // =================================================================
    const authResponse = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    });
    const authData = await authResponse.json();
    const token = authData.token;
    if (!token) {
      console.error("Paymob authentication failed:", authData);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }

    // =================================================================
    // Step 2: Order Registration API
    // =================================================================
    const orderResponse = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        delivery_needed: 'false',
        amount_cents: amount_cents,
        currency: currency || 'EGP',
        items: items,
      }),
    });
    const orderData = await orderResponse.json();
    const orderId = orderData.id;
    if (!orderId) {
      console.error("Paymob order registration failed:", orderData);
      return NextResponse.json({ error: 'Order registration failed' }, { status: 500 });
    }
    
    // =================================================================
    // الخطوة 2.5: إنشاء سجل في جدول "payments" بحالة "pending"
    // =================================================================
    const CREATE_PAYMENT = `
      mutation CreatePayment($userId: uuid!, $amount: float8!, $orderId: String!, $planId: uuid!, $createdAt: timestamptz!) {
        insert_Voice_Studio_payments_one(object: {
            user_id: $userId, 
            amount: $amount, 
            transaction_id: $orderId,
            plan_id: $planId, 
            status: "pending",
            currency: "EGP",
            payment_method: "Paymob",
            created_at: $createdAt
        }) {
          id
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
            query: CREATE_PAYMENT,
            variables: {
                userId: userId,
                amount: parseInt(amount_cents),
                orderId: orderId.toString(),
                planId: plan_id,
                createdAt: new Date().toISOString(),
            },
        }),
    });
    const hasuraResult = await hasuraResponse.json();
    if (hasuraResult.errors) {
        console.error("Failed to create transaction record in Hasura:", hasuraResult.errors);
        return NextResponse.json({ error: 'Could not save transaction locally.' }, { status: 500 });
    }

    // =================================================================
    // Step 3: Payment Key Request
    // =================================================================
    const integration_id = payment_method === 'wallet' 
        ? process.env.PAYMOB_WALLET_INTEGRATION_ID 
        : process.env.PAYMOB_INTEGRATION_ID;

    console.log("Using integration_id:", integration_id);

    const paymentKeyResponse = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: token,
        amount_cents: amount_cents,
        expiration: 3600,
        order_id: orderId,
        billing_data: {
          ...billing_data,
          apartment: "NA", floor: "NA", street: "NA", building: "NA",
          shipping_method: "NA", postal_code: "NA", city: "NA",
          country: "NA", state: "NA",
        },
        currency: currency || 'EGP',
        integration_id: integration_id,
        lock_order_when_paid: 'false',
      }),
    });
    const paymentKeyData = await paymentKeyResponse.json();
    const paymentToken = paymentKeyData.token;
    if (!paymentToken) {
       console.error("Paymob payment key request failed:", paymentKeyData);
      return NextResponse.json({ error: 'Failed to get payment key' }, { status: 500 });
    }

    // =================================================================
    // Final Step: Construct Iframe URL or Redirect URL
    // =================================================================
    if (payment_method === 'wallet') {
        const walletPayResponse = await fetch('https://accept.paymob.com/api/acceptance/payments/pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source: {
                    identifier: billing_data.phone_number, 
                    subtype: 'WALLET'
                },
                payment_token: paymentToken
            })
        });
        const walletPayData = await walletPayResponse.json();
        const redirectUrl = walletPayData.redirection_url || walletPayData.redirect_url;

        if (redirectUrl) {
            return NextResponse.json({ redirectUrl: redirectUrl });
        } else {
            console.error("Paymob wallet payment failed:", walletPayData);
            return NextResponse.json({ error: 'Failed to process wallet payment' }, { status: 500 });
        }
    } else {
        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
        return NextResponse.json({ redirectUrl: iframeUrl });
    }

  } catch (error) {
    console.error('Paymob integration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
