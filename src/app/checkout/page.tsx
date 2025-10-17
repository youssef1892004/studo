// src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import Button from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';

import { executeGraphQL } from '@/lib/graphql';

import CenteredLoader from '@/components/CenteredLoader';



// GraphQL query to get plan details by ID

const GET_PLAN_BY_ID = `

  query GetPlanById($id: uuid!) {

        Voice_Studio_Plans_by_pk(id: $id) {

          id

          name

          price

          max_chars

        }

  }

`;



const CREATE_FREE_SUBSCRIPTION = `



  mutation CreateFreeSubscription($userId: uuid!, $planId: uuid!, $maxChars: Int!) {



    insert_Voice_Studio_subscriptions_one(object: {



      user_id: $userId,



      plan_id: $planId,



      remaining_chars: $maxChars,



      active: true,



      auto_renew: false



    }) {



      id



    }



  }



`;



interface Plan {



  id: string;



  name: string;



  price: string; // price in cents, but stored as text in DB



  max_chars: number;



}



const CheckoutPageContent = () => {

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);

  const [isFetchingPlan, setIsFetchingPlan] = useState(true);



  const { user, token } = useAuth();

  const searchParams = useSearchParams();

  const router = useRouter();

  const planId = searchParams.get('plan_id');



  useEffect(() => {

    if (!planId) {

      setError('No plan selected. Please go back and choose a plan.');

      setIsFetchingPlan(false);

      return;

    }



    const fetchPlan = async () => {

      try {

        const response = await executeGraphQL<{ Voice_Studio_Plans_by_pk: Plan }> ({

          query: GET_PLAN_BY_ID,

          variables: { id: planId },

        });



        if (response.errors) {

          throw new Error(response.errors[0].message);

        }

        if (!response.data?.Voice_Studio_Plans_by_pk) {

          throw new Error('Plan not found.');

        }

        setPlan(response.data.Voice_Studio_Plans_by_pk);

      } catch (err: any) {

        setError(err.message);

      } finally {

        setIsFetchingPlan(false);

      }

    };



    fetchPlan();

  }, [planId]);



  const handleFreeSubscription = async () => {

    if (!user || !plan) return;



    setIsLoading(true);

    setError(null);



    try {

      const response = await executeGraphQL({

        query: CREATE_FREE_SUBSCRIPTION,

                variables: {

                  userId: user.id,

                  planId: plan.id,

                  maxChars: plan.max_chars,

                },

      });



      if (response.errors) {

        throw new Error(response.errors[0].message);

      }



      // Redirect to projects page after successful subscription

      router.push('/projects');



    } catch (err: any) {

      setError(err.message);

      setIsLoading(false);

    }

  };



  const handlePayment = async () => {

    if (!user || !token || !plan) {

      const errorMessage = !user ? "You must be logged in to complete the purchase." : "Plan data is not loaded yet.";

      setError(errorMessage);

      return;

    }



        // Handle free plan



        if (parseInt(plan.price) === 0) {



          await handleFreeSubscription();



          return;



        }



    



        // Handle paid plan



        setIsLoading(true);



        setError(null);



    



        const orderDetails = {



          amount_cents: plan.price,



          currency: 'EGP',



          plan_id: plan.id,



          items: [



            {



              name: plan.name,



              amount_cents: plan.price,



              description: 'Subscription for AI Studio',



              quantity: '1',



            },



          ],



          billing_data: {



            first_name: user.displayName.split(' ')[0] || 'N/A',



            last_name: user.displayName.split(' ').slice(1).join(' ') || 'N/A',



            email: user.email,



            phone_number: "+201111111111", // TODO: This should be fetched from user profile if available



          },



        };



    



        try {



          const response = await fetch('/api/payments/paymob', {



            method: 'POST',



            headers: {



              'Content-Type': 'application/json',



              'Authorization': `Bearer ${token}`,



            },



            body: JSON.stringify(orderDetails),



          });



    



          if (!response.ok) {



            const errData = await response.json();



            throw new Error(errData.error || 'Failed to initiate payment');



          }



    



          const data = await response.json();



          if (data.iframeUrl) {



            window.location.href = data.iframeUrl;



          } else {



            throw new Error(data.error || 'Could not get payment URL');



          }



        } catch (err: any) {



          setError(err.message);



        } finally {



          setIsLoading(false);



        }



      };



    



      if (isFetchingPlan) {



        return <CenteredLoader message="Loading Plan..." />;



      }



    



      if (error && !plan) {



        return <div className="text-red-500 text-center p-8">Error: {error}</div>;



      }



    



      if (!plan) {



        return <div className="text-center p-8">Could not load plan details.</div>;



      }



    



      return (



        <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-screen">



          <h1 className="text-3xl font-bold mb-6">Checkout</h1>



          <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-xl border">



            <div className="mb-6 text-center">



              <p className="text-lg font-semibold text-gray-700">{plan.name}</p>



              <p className="text-4xl font-bold mt-2">{(parseInt(plan.price) / 100).toFixed(2)} EGP</p>



            </div>



            <Button onClick={handlePayment} disabled={isLoading || !user} className="w-full text-lg py-6">



              {isLoading ? 'Processing...' : 'Pay Now with Paymob'}



            </Button>
        {!user && <p className="text-yellow-600 mt-4 text-center">Please log in to proceed.</p>}
        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

// Wrap with Suspense because useSearchParams requires it.
const CheckoutPage = () => (
    <Suspense fallback={<CenteredLoader message="Loading Checkout..." />}>
        <CheckoutPageContent />
    </Suspense>
);

export default CheckoutPage;