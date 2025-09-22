'use client';

import { AuthContext } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useContext } from "react";

export default function LandingPage() {
    const authContext = useContext(AuthContext);

    // يوجه المستخدم إلى صفحة المشاريع إذا كان مسجلاً الدخول، أو إلى صفحة الدخول إذا لم يكن كذلك
    const projectLink = authContext?.user ? "/projects" : "/login";

    return (
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-6 py-12 bg-gray-50">
            <div className="max-w-4xl w-full space-y-12">
                {/* Main Title */}
                <div className="space-y-6">
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent leading-tight animate-fade-in-down">
                        استوديو الصوت العربي الأول
                        <span className="block mt-2">بالذكاء الاصطناعي</span>
                    </h1>
                    
                    <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto animate-fade-in-up opacity-0">
                        حوّل نصوصك إلى أصوات طبيعية وواقعية بأكثر من 30 لهجة عربية.
                        <span className="block mt-1">ابدأ تجربتك الآن وأنشئ محتوى صوتي لم يسبق له مثيل.</span>
                    </p>
                </div>

                {/* CTA Button */}
                <div className="animate-fade-in-scale opacity-0">
                    <Link 
                        href={projectLink}
                        className="group inline-flex items-center justify-center px-10 py-5 bg-black text-white font-bold text-lg rounded-2xl shadow-lg hover:bg-gray-800 transition-all duration-500 transform hover:scale-105 animate-float animate-glow"
                    >
                        ابدأ مشروع جديد
                        {/* تعديل بسيط على اتجاه السهم ليناسب اللغة العربية */}
                        <ArrowLeft className="ml-3 h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>

                {/* Features Highlight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 animate-fade-in-up opacity-0" style={{animationDelay: '0.6s'}}>
                    <div className="p-6 rounded-xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <div className="text-4xl mb-4">🎙️</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">جودة احترافية</h3>
                        <p className="text-gray-600">أصوات واقعية بجودة استوديو</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <div className="text-4xl mb-4">🌍</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">30+ لهجة عربية</h3>
                        <p className="text-gray-600">من المغرب إلى الخليج</p>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-white shadow-sm hover:shadow-lg transition-shadow duration-300">
                        <div className="text-4xl mb-4">⚡</div>
                        <h3 className="font-bold text-lg mb-2 text-gray-800">سرعة فائقة</h3>
                        <p className="text-gray-600">تحويل فوري للنصوص</p>
                    </div>
                </div>
            </div>
        </main>
    );
}