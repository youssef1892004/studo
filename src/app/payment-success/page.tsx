'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
    const { refreshSubscription } = useAuth();

    useEffect(() => {
        refreshSubscription();
    }, [refreshSubscription]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center max-w-md">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">تم الدفع بنجاح!</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">تم تفعيل اشتراكك بنجاح. يمكنك الآن الاستمتاع بجميع مزايا خطتك الجديدة.</p>
                <Link href="/projects" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    الانتقال إلى مشاريعي
                </Link>
            </div>
        </div>
    );
}
