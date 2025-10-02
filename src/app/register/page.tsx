// File path: src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// [NEW] استيراد toast
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // [REMOVED] تم حذف حالة error
  const [isLoading, setIsLoading] = useState(false);
  // حالة الموافقة على الشروط
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // [REMOVED] تم حذف setError

    // التحقق من الموافقة على الشروط
    if (!hasAgreed) {
        // [MODIFIED] استخدام toast.error
        toast.error('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل التسجيل.');
      }

      // [NEW] عرض رسالة النجاح
      toast.success('تم إنشاء الحساب بنجاح! جاري تحويلك لتسجيل الدخول.');
      
      // On successful registration, redirect to the login page
      router.push('/login');
    } catch (err: any) {
      // [MODIFIED] استخدام toast.error لعرض الخطأ
      toast.error(err.message || 'حدث خطأ غير متوقع أثناء التسجيل.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800">إنشاء حساب جديد</h1>
        {/* [REMOVED] تم حذف عرض رسالة الخطأ المحلية */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              الاسم
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* حقل الموافقة على الشروط */}
          <div className="flex items-center mt-4">
              <input
                  type="checkbox"
                  id="terms"
                  checked={hasAgreed}
                  onChange={(e) => setHasAgreed(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 pr-2">
                  أوافق على 
                  <Link href="/legal" target="_blank" className="font-medium text-blue-600 hover:underline mr-1">
                      الشروط والأحكام وسياسة الخصوصية
                  </Link>
              </label>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {isLoading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
          </div>
        </form>
         <p className="text-sm text-center text-gray-600">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            سجل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}