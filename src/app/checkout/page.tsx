// src/app/checkout/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CreditCard, DollarSign, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Checkout | قريباً',
  description: 'صفحة الدفع لخدمة Voice Studio. ميزة الشراء ستكون متاحة قريباً.',
  keywords: ['دفع', 'قريباً', 'فيزا', 'فودافون كاش', 'بطاقات ائتمان'],
  robots: { index: false, follow: false }, // منع فهرسة الصفحة المؤقتة
};

export default function CheckoutPage() {
  
  return (
    <div className="min-h-screen pt-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto p-8 text-center">
        
        <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-t-8 border-blue-600">
            <h1 className="text-4xl font-extrabold mb-6 text-gray-900 dark:text-white">
                هذه الخدمة قادمة قريباً!
            </h1>
            
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed">
                نحن نعمل حالياً على دمج نظام الدفع. هذه الميزة سوف تكون متاحة في الأيام القادمة.
            </p>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 flex items-center justify-center">
                <CreditCard className="w-6 h-6 ml-3 text-blue-600" />
                طرق الدفع المستقبلية المدعومة:
            </h2>
            
            <div className="grid grid-cols-2 gap-4 text-lg font-medium">
                
                {/* البطاقات العالمية / الإنترنت */}
                <div className="col-span-2 md:col-span-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-right">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">البطاقات العالمية / الإنترنت:</p>
                    <ul className="space-y-2">
                        <li className="flex items-center justify-end text-indigo-600 dark:text-indigo-400">
                            <span className="mr-2">Visa / Mastercard</span>
                            <CreditCard size={20} />
                        </li>
                        <li className="flex items-center justify-end text-blue-700 dark:text-blue-400">
                            <span className="mr-2">PayPal (باي بال)</span>
                            <DollarSign size={20} />
                        </li>
                    </ul>
                </div>

                {/* المحافظ الإلكترونية المحلية */}
                <div className="col-span-2 md:col-span-1 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-right">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">المحافظ الإلكترونية المحلية:</p>
                    <ul className="space-y-2">
                        <li className="flex items-center justify-end text-red-600 dark:text-red-400">
                            <span className="mr-2">Vodafone Cash (فودافون كاش)</span>
                            <Zap size={20} />
                        </li>
                        <li className="flex items-center justify-end text-yellow-700 dark:text-yellow-400">
                            <span className="mr-2">Masary (مصاري)</span>
                            <DollarSign size={20} />
                        </li>
                        <li className="flex items-center justify-end text-green-700 dark:text-green-400">
                            <span className="mr-2">Aman (أمان)</span>
                            <DollarSign size={20} />
                        </li>
                    </ul>
                </div>
            </div>
            
            <Link 
                href="/pricing" 
                className="mt-10 inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة إلى خطط الأسعار
            </Link>
            
        </div>
      </div>
    </div>
  );
}