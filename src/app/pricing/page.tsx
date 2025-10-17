'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Zap, Star, Users, DollarSign } from 'lucide-react';
import { executeGraphQL } from '@/lib/graphql';
import CenteredLoader from '@/components/CenteredLoader';

const GET_PLANS = `
  query GetPlans {
    Voice_Studio_Plans(order_by: {price: asc}) {
      id
      name
      price
      max_chars
      support_level
    }
  }
`;

interface Plan {
  id: string;
  name: string;
  price: number;
  max_chars: number;
  support_level: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await executeGraphQL<{ Voice_Studio_Plans: Plan[] }>({
          query: GET_PLANS,
        });
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }
        setPlans(response.data?.Voice_Studio_Plans || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('Chars')) return <Clock size={18} className="text-green-500" />;
    if (feature.includes('Support')) return <Zap size={18} className="text-green-500" />;
    return <Star size={18} className="text-green-500" />;
  };

  if (isLoading) {
    return <CenteredLoader message="Loading Plans..." />;
  }

  if (error) {
    return <div className="text-red-500 text-center p-8">Error loading plans: {error}</div>;
  }

  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-8">
        
        <Link 
            href="/" 
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى الرئيسية
        </Link>
        
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            خطط الأسعار المرنة
        </h1>
        <p className="text-xl text-center text-gray-600 dark:text-gray-400 mb-12">
            اختر الخطة التي تناسب احتياجاتك لإنتاج محتوى صوتي احترافي.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 justify-center">
          {plans.map(plan => (
            <div key={plan.id} className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">{plan.name}</h2>
                    <div className="text-5xl font-extrabold my-6">
                        ${(plan.price / 100).toFixed(2)}
                        <span className="text-xl font-normal">/شهرياً</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        <li className="flex items-center justify-end">
                            <span className="mr-3">{plan.max_chars.toLocaleString()} Chars/month</span>
                            {getFeatureIcon('Chars')}
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">{plan.support_level} Support</span>
                            {getFeatureIcon('Support')}
                        </li>
                    </ul>
                </div>
                <Link 
                    href={`/checkout?plan_id=${plan.id}`}
                    className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mt-6"
                >
                    اشترك الآن
                </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}