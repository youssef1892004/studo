'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, DollarSign, Clock, Zap, Star, Users } from 'lucide-react';

// Metadata is not used in client components, but we can keep it for reference or move it to a layout.

export default function PricingPage() {
  const [showContact, setShowContact] = useState(false);

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

            {/* 1. Free Tier */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">الباقة المجانية</h2>
                    <p className="text-lg text-gray-500 mb-6">ابدأ تجربتك بدون أي التزام.</p>
                    <div className="text-5xl font-extrabold mb-6">
                        $0
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        <li className="flex items-center justify-end">
                            <span className="mr-3">**10,000** كلمة شهرياً</span>
                            <Clock size={18} className="text-green-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">الوصول للأصوات القياسية</span>
                            <Zap size={18} className="text-green-500" />
                        </li>
                        <li className="flex items-center justify-end opacity-50">
                            <span className="mr-3 line-through">تشكيل الحروف العربية</span>
                            <Star size={18} className="text-red-500" />
                        </li>
                    </ul>
                </div>
                <Link 
                    href="/register" 
                    className="block w-full py-3 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
                >
                    ابدأ مجاناً
                </Link>
            </div>

            {/* 2. $3 Tier */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">الباقة الأساسية</h2>
                    <p className="text-lg text-gray-500 mb-6">مثالية للمشاريع الصغيرة.</p>
                    <div className="text-5xl font-extrabold text-blue-600 mb-6">
                        $3<span className="text-xl font-normal">/شهرياً</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        <li className="flex items-center justify-end">
                            <span className="mr-3">**15,000** كلمة شهرياً</span>
                            <Clock size={18} className="text-blue-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">الوصول لجميع الأصوات</span>
                            <Zap size={18} className="text-blue-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">ميزة تشكيل الحروف العربية</span>
                            <Star size={18} className="text-blue-500" />
                        </li>
                    </ul>
                </div>
                <Link 
                    href="/checkout?tier=basic" 
                    className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    اشترك الآن
                </Link>
            </div>

            {/* 3. $5 Tier (Most Popular) */}
            <div className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-2xl ring-4 ring-blue-500 text-center flex flex-col justify-between transform lg:scale-105">
                <div>
                    <p className="text-sm font-semibold text-white bg-blue-600 py-1 px-4 rounded-full inline-block mb-4">الأكثر شعبية</p>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">الباقة الاحترافية</h2>
                    <p className="text-lg text-gray-500 dark:text-gray-300 mb-6">لصناع المحتوى المحترفين.</p>
                    <div className="text-5xl font-extrabold text-blue-600 mb-6">
                        $5<span className="text-xl font-normal">/شهرياً</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        <li className="flex items-center justify-end">
                            <span className="mr-3">**50,000** كلمة شهرياً</span>
                            <Clock size={18} className="text-blue-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">الوصول لجميع الأصوات</span>
                            <Zap size={18} className="text-blue-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">ميزة تشكيل الحروف العربية</span>
                            <Star size={18} className="text-blue-500" />
                        </li>
                    </ul>
                </div>
                <Link 
                    href="/checkout?tier=pro" 
                    className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    اشترك الآن
                </Link>
            </div>

            {/* 4. Enterprise Tier */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center flex flex-col justify-between">
                <div>
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">باقة الشركات</h2>
                    <p className="text-lg text-gray-500 mb-6">حلول مخصصة للشركات الكبيرة.</p>
                    <div className="text-4xl font-extrabold text-gray-800 dark:text-white mb-6">
                        يبدأ من <span className="text-green-600">$10</span>
                    </div>
                    <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-right mb-8">
                        <li className="flex items-center justify-end">
                            <span className="mr-3">أصوات حصرية ومخصصة</span>
                            <Users size={18} className="text-green-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">خدمة ودعم بأولوية</span>
                            <Zap size={18} className="text-green-500" />
                        </li>
                        <li className="flex items-center justify-end">
                            <span className="mr-3">كمية كلمات قابلة للتفاوض</span>
                            <DollarSign size={18} className="text-green-500" />
                        </li>
                    </ul>
                </div>
                <div className="mt-auto">
                  {showContact ? (
                    <div className="text-left bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">Email: <a href="mailto:aivoicestudio.s@gmail.com" className="text-blue-500 hover:underline">aivoicestudio.s@gmail.com</a></p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white mt-2">Phone: <a href="tel:+201115145338" className="text-blue-500 hover:underline">+201115145338</a></p>
                    </div>
                  ) : (
                    <button 
                        onClick={() => setShowContact(true)}
                        className="block w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-black transition-colors"
                    >
                        تواصل معنا
                    </button>
                  )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}