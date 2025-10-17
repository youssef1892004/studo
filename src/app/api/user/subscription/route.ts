// src/app/api/user/subscription/route.ts
import { NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { executeGraphQL } from '@/lib/graphql';

interface DecodedToken {
    'https://hasura.io/jwt/claims': {
        'x-hasura-user-id': string;
    };
}

async function getUserIdFromRequest(req: Request): Promise<string | null> {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        
        const token = authHeader.split(' ')[1];
        const jwtSecret = JSON.parse(process.env.HASURA_GRAPHQL_JWT_SECRET!);
        if (!jwtSecret?.key) return null;

        const decoded = jwt.verify(token, jwtSecret.key) as DecodedToken;
        return decoded?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] || null;
    } catch (error) {
        console.error("JWT verification error:", error);
        return null;
    }
}

// Query 1: Get the basic subscription object with plan_id
const GET_SUBSCRIPTION_WITH_PLAN_ID = `
  query GetActiveSubscription($userId: uuid!) {
    Voice_Studio_subscriptions(
      where: {user_id: {_eq: $userId}, active: {_eq: true}, end_date: {_gt: "now()"}},
      order_by: {end_date: desc},
      limit: 1
    ) {
      id
      active
      remaining_chars
      end_date
      plan_id
    }
  }
`;

// Query 2: Get plan details by its ID
const GET_PLAN_BY_ID = `
  query GetPlanById($planId: uuid!) {
    Voice_Studio_Plans_by_pk(id: $planId) {
      name
      max_chars
    }
  }
`;

export async function GET(req: Request) {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Step 1: Fetch the user's active subscription
        const subResponse = await executeGraphQL<{ Voice_Studio_subscriptions: any[] }>({
            query: GET_SUBSCRIPTION_WITH_PLAN_ID,
            variables: { userId },
        });

        if (subResponse.errors) {
            throw new Error(`Hasura sub query failed: ${subResponse.errors[0].message}`);
        }

        const subscriptionBase = subResponse.data?.Voice_Studio_subscriptions[0];

        // If no active subscription, return null which is a valid state
        if (!subscriptionBase) {
            return NextResponse.json({ subscription: null });
        }

        // Step 2: Fetch the details of the plan using the plan_id from the subscription
        const planResponse = await executeGraphQL<{ Voice_Studio_Plans_by_pk: any }>({
            query: GET_PLAN_BY_ID,
            variables: { planId: subscriptionBase.plan_id },
        });

        if (planResponse.errors) {
            throw new Error(`Hasura plan query failed: ${planResponse.errors[0].message}`);
        }

        const planDetails = planResponse.data?.Voice_Studio_Plans_by_pk;

        if (!planDetails) {
             throw new Error(`Plan with ID ${subscriptionBase.plan_id} not found.`);
        }

        // Step 3: Combine the subscription and plan details into the final object
        const fullSubscription = {
            ...subscriptionBase,
            plan: planDetails,
        };

        return NextResponse.json({ subscription: fullSubscription });

    } catch (error: any) {
        console.error('Subscription API error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}