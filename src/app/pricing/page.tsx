// src/app/pricing/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Clock, Zap, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing | أسعار الخدمة',
  description: 'اكتشف خطط الأسعار المرنة لتوليد الكلام العربي عبر الذكاء الاصطناعي مع Voice Studio.',
  keywords: ['أسعار', 'خطط اشتراك', 'AI TTS Pricing', 'Voice Studio'],
  robots: { index: true, follow: true },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* زر العودة */}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. خطة مجانية (Free Tier) */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 text-center">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">تجربة مجانية</h2>
                <p className="text-lg text-gray-500 mb-6">ابدأ تجربتك بدون أي التزام.</p>
                <div className="text-5xl font-extrabold text-blue-600 mb-6">
                    $0
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                    <li className="flex items-center justify-end">
                        <span className="mr-3">**15 دقيقة** من الصوت شهرياً</span>
                        <Clock size={18} className="text-green-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">الوصول لجميع الأصوات القياسية</span>
                        <Zap size={18} className="text-green-500" />
                    </li>
                    <li className="flex items-center justify-end opacity-50">
                        <span className="mr-3 line-through">تشكيل آلي متقدم (Pro)</span>
                        <Star size={18} className="text-red-500" />
                    </li>
                </ul>
                <Link 
                    href="/register" 
                    className="block w-full py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                    ابدأ مجاناً
                </Link>
            </div>
            
            {/* 2. الخطة الاحترافية (Pro Tier) */}
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-2xl ring-4 ring-blue-500 text-center transform lg:scale-105">
                <p className="text-sm font-semibold text-white bg-blue-600 py-1 px-4 rounded-full inline-block mb-4">الأكثر شعبية</p>
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">الخطة الاحترافية</h2>
                <p className="text-lg text-gray-500 dark:text-gray-300 mb-6">لصناع المحتوى المحترفين.</p>
                <div className="text-5xl font-extrabold text-blue-600 mb-6">
                    $9<span className="text-xl font-normal">/شهرياً</span>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                    <li className="flex items-center justify-end">
                        <span className="mr-3">**ساعة كاملة (60 دقيقة)** من الصوت شهرياً</span>
                        <Clock size={18} className="text-blue-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">الوصول لجميع أصوات Pro Arabic</span>
                        <Zap size={18} className="text-blue-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">**تشكيل آلي متقدم (Pro)**</span>
                        <Star size={18} className="text-blue-500" />
                    </li>
                </ul>
                <Link 
                    href="/checkout" 
                    className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    اشترك الآن
                </Link>
            </div>
            
            {/* 3. الخطة الأكبر (Highest Tier) - قريباً */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-xl border-2 border-gray-400 dark:border-gray-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-700 dark:text-gray-300 transform rotate-[-15deg] bg-yellow-400 px-4 py-1 rounded-lg">قريباً</span>
                </div>
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">الخطة الأكبر</h2>
                <p className="text-lg text-gray-500 dark:text-gray-300 mb-6">جودة صوت لا مثيل لها.</p>
                <div className="text-5xl font-extrabold text-gray-600 dark:text-gray-300 mb-6">
                    Custom
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                    <li className="flex items-center justify-end">
                        <span className="mr-3">ثلث ساعة (20 دقيقة) من الصوت</span>
                        <Clock size={18} className="text-purple-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">الوصول لتقنيات الجيل التالي (AI)</span>
                        <Zap size={18} className="text-purple-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">**أحدث نماذج صوت أوضح**</span>
                        <Star size={18} className="text-purple-500" />
                    </li>
                </ul>
                <Link 
                    href="/checkout" 
                    className="block w-full py-3 bg-gray-500 text-white font-semibold rounded-lg cursor-not-allowed"
                >
                    اشترك الآن
                </Link>
            </div>

            {/* 4. خطة المؤسسات (Enterprise Tier) */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 text-center">
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">خطة الشركات</h2>
                <p className="text-lg text-gray-500 mb-6">للشركات الكبيرة والدعم المخصص.</p>
                <div className="text-5xl font-extrabold text-gray-600 dark:text-gray-300 mb-6">
                    Custom
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                    <li className="flex items-center justify-end">
                        <span className="mr-3">حجم غير محدود</span>
                        <DollarSign size={18} className="text-yellow-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">نماذج صوتية حصرية</span>
                        <Zap size={18} className="text-yellow-500" />
                    </li>
                    <li className="flex items-center justify-end">
                        <span className="mr-3">SLA ودعم تقني على مدار الساعة</span>
                        <Star size={18} className="text-yellow-500" />
                    </li>
                </ul>
                <Link 
                    href="/checkout" 
                    className="block w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-black transition-colors"
                >
                    اشترك الآن
                </Link>
            </div>
            
        </div>
      </div>
    </div>
  );
}