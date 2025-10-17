// src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Button from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { executeGraphQL } from '@/lib/graphql';
import CenteredLoader from '@/components/CenteredLoader';
import { FaMoneyBillWave, FaShieldAlt, FaCreditCard, FaWallet } from 'react-icons/fa';

// GraphQL query to get plan details by ID
const GET_PLAN_BY_ID = `
  query GetPlanById($id: uuid!) {
    Voice_Studio_Plans_by_pk(id: $id) {
      id
      name
      price
      max_chars
      max_vioce_clones
      support_level
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
  price: string;
  max_chars: number;
  max_vioce_clones: number;
  support_level: string;
}

const CheckoutPageContent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isFetchingPlan, setIsFetchingPlan] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [walletPhoneNumber, setWalletPhoneNumber] = useState('');

  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan_id');

  useEffect(() => {
    if (!planId) {
      setError('لم يتم تحديد أي خطة. يرجى العودة واختيار خطة.');
      setIsFetchingPlan(false);
      return;
    }

    const fetchPlan = async () => {
      try {
        const response = await executeGraphQL<{ Voice_Studio_Plans_by_pk: Plan }>({
          query: GET_PLAN_BY_ID,
          variables: { id: planId },
        });

        if (response.errors) {
          throw new Error(response.errors[0].message);
        }
        if (!response.data?.Voice_Studio_Plans_by_pk) {
          throw new Error('لم يتم العثور على الخطة.');
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
      router.push('/projects');
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user || !token || !plan) {
      const errorMessage = !user ? "يجب عليك تسجيل الدخول لإتمام عملية الشراء." : "بيانات الخطة لم يتم تحميلها بعد.";
      setError(errorMessage);
      return;
    }

    if (parseInt(plan.price) === 0) {
      await handleFreeSubscription();
      return;
    }

    setIsLoading(true);
    setError(null);

    const orderDetails = {
      amount_cents: plan.price,
      currency: 'EGP',
      plan_id: plan.id,
      items: [{
        name: plan.name,
        amount_cents: plan.price,
        description: 'Subscription for AI Studio',
        quantity: '1',
      }],
      billing_data: {
        first_name: user.displayName.split(' ')[0] || 'N/A',
        last_name: user.displayName.split(' ').slice(1).join(' ') || 'N/A',
        email: user.email,
        phone_number: walletPhoneNumber || "+201111111111", // TODO: This should be fetched from user profile if available
      },
      payment_method: paymentMethod,
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
        throw new Error(errData.error || 'فشل في بدء عملية الدفع');
      }

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.error || 'لا يمكن الحصول على رابط الدفع');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingPlan) {
    return <CenteredLoader message="جاري تحميل الخطة..." />;
  }

  if (error && !plan) {
    return <div className="text-red-500 text-center p-8">خطأ: {error}</div>;
  }

  if (!plan) {
    return <div className="text-center p-8">لا يمكن تحميل تفاصيل الخطة.</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">إتمام عملية الشراء</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Plan Details & Payment */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">ملخص الطلب</h2>
            
            <div className="border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">{plan.name}</h3>
                <p className="text-2xl font-bold text-indigo-600">{(parseInt(plan.price) / 100).toFixed(2)} جنيه</p>
              </div>
              <div className="space-y-3 text-gray-600">
                <p><span className="font-semibold">الحد الأقصى للحروف:</span> {plan.max_chars.toLocaleString()}</p>
                <p><span className="font-semibold">استنساخ الأصوات:</span> {plan.max_vioce_clones.toLocaleString()}</p>
                <p><span className="font-semibold">مستوى الدعم:</span> {plan.support_level}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">اختر طريقة الدفع</h3>
              <div className="space-y-3">
                <div onClick={() => setPaymentMethod('card')} className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-indigo-500 ${paymentMethod === 'card' ? 'border-indigo-500' : 'border-gray-300'}`}>
                  <div className="flex items-center">
                    <FaCreditCard className="text-indigo-500 mr-4" size={24} />
                    <span className="font-semibold">البطاقة الائتمانية</span>
                  </div>
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-500' : 'border-gray-400'}`}>
                    {paymentMethod === 'card' && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                  </div>
                </div>
                <div onClick={() => setPaymentMethod('wallet')} className={`flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:border-indigo-500 ${paymentMethod === 'wallet' ? 'border-indigo-500' : 'border-gray-300'}`}>
                  <div className="flex items-center">
                    <FaWallet className="text-indigo-500 mr-4" size={24} />
                    <span className="font-semibold">المحفظة الإلكترونية</span>
                  </div>
                  <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${paymentMethod === 'wallet' ? 'border-indigo-500' : 'border-gray-400'}`}>
                    {paymentMethod === 'wallet' && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                  </div>
                </div>
              </div>
            </div>

            {paymentMethod === 'wallet' && (
              <div className="mb-6">
                <label htmlFor="wallet-phone" className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف المحفظة</label>
                <input
                  type="tel"
                  id="wallet-phone"
                  value={walletPhoneNumber}
                  onChange={(e) => setWalletPhoneNumber(e.target.value)}
                  placeholder="e.g., 01xxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <Button onClick={handlePayment} disabled={isLoading || !user} className="w-full text-lg py-4 bg-indigo-600 hover:bg-indigo-700 transition duration-300">
              {isLoading ? 'جاري المعالجة...' : 'ادفع الآن'}
            </Button>
            {!user && <p className="text-yellow-600 mt-4 text-center">الرجاء تسجيل الدخول للمتابعة.</p>}
            {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
          </div>

          {/* Right Column: Trust Badges & Info */}
          <div className="bg-gray-100 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
            <FaShieldAlt className="text-green-500 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">دفع آمن ومضمون</h3>
            <p className="text-gray-600 mb-6">
              نحن نستخدم Paymob لمعالجة المدفوعات بشكل آمن. بياناتك مشفرة ومحمية بالكامل.
            </p>
            <div className="space-y-4">
              <div className="flex items-center text-left">
                <FaMoneyBillWave className="text-gray-500 mr-3" size={20} />
                <span>استرداد كامل المبلغ خلال 7 أيام</span>
              </div>
              <div className="flex items-center text-left">
                <FaCreditCard className="text-gray-500 mr-3" size={20} />
                <span>جميع البطاقات الائتمانية مقبولة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap with Suspense because useSearchParams requires it.
const CheckoutPage = () => (
    <Suspense fallback={<CenteredLoader message="جاري تحميل صفحة الدفع..." />}>
        <CheckoutPageContent />
    </Suspense>
);

export default CheckoutPage;