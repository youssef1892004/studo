// src/app/page.tsx
'use client';
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { ArrowLeft, Play, Mic, Globe, Zap, Star, CheckCircle, Code, Database, Users, Shield, Edit, Download, DollarSign } from "lucide-react"; 
import Image from 'next/image';
import { AuthContext } from '@/contexts/AuthContext'; 
// import CountUpOnScroll from '@/components/CountUpOnScroll'; // تم حذفه لأنه غير مستخدم
import { useRouter } from 'next/navigation';

export default function LandingPage() {
    const router = useRouter();
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const projectLink = user ? "/projects" : "/login";

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentVoice, setCurrentVoice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const voiceExamples = useMemo(() => [
        { name: "أحمد", dialect: "مصري", 
            text: "أول موقع في الوطن العربي متخصص في AI Studio", 
            audioUrl: "/generated_audio/1.mp3" 
        },
        { name: "محمد", dialect: "مغربي", 
            text: "مرحباً بك في مشروعك الجديد", 
            audioUrl: "/generated_audio/3.mp3" 
        }
    ], []);

    useEffect(() => {
        if (user) {
            router.push('/projects');
        }
    }, [user, router]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            // تشغيل المقطع التالي أو إعادة التعيين
            if (currentVoice < voiceExamples.length - 1) {
                setCurrentVoice(prev => prev + 1);
            } else {
                setCurrentVoice(0);
                setIsPlaying(false);
            }
        };

        audio.addEventListener('ended', handleEnded);

        if (isPlaying) {
            const currentUrl = voiceExamples[currentVoice].audioUrl;
            if (audio.src !== currentUrl) {
                audio.src = currentUrl;
                audio.load();
            }
            
            audio.play().catch(e => {
                console.error("Audio play failed (Autoplay policy or loading error):", e);
                setIsPlaying(false);
            });
        } else {
            audio.pause();
        }
        
        return () => {
            audio.removeEventListener('ended', handleEnded);
        };
        
    }, [isPlaying, currentVoice, voiceExamples]);

    if (user) {
        return null; 
    }

    const handlePlayDemo = () => {
        if (voiceExamples.length === 0) return;

        if (!isPlaying && currentVoice === voiceExamples.length - 1) {
            setCurrentVoice(0);
        }

        setIsPlaying(prev => !prev);
    };

    return (
      <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
        <audio ref={audioRef} />

        {/* 1. Hero Section */}
        <section className="relative z-10 text-center px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              منصة الذكاء الاصطناعي الصوتي
              <span className="block mt-4">الأكثر واقعية</span>
            </h1>
            
            <p className="text-xl text-gray-700 mb-12 max-w-4xl mx-auto leading-relaxed">
              حوّل أفكارك لمحتوى صوتي ومرئي احترافي بدعم الذكاء الاصطناعي.
              <span className="block mt-2">إنتاج سريع دون الحاجة لمعدات أو خبرة تقنية.</span>
            </p>

            {/* [MODIFIED] Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a
                href={projectLink}
                className="group inline-flex items-center justify-center px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                ابدأ الآن مجانًا
                <ArrowLeft className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              
              {/* [NEW CTA] شاهد جميع الخطط والأسعار */}
              <a 
                href="/pricing"
                className="group inline-flex items-center justify-center px-8 py-4 border border-blue-600 text-blue-600 hover:text-blue-700 hover:border-blue-700 font-medium text-lg rounded-xl transition-all duration-300"
              >
                <DollarSign className={`ml-2 h-5 w-5`} />
                شاهد جميع الخطط والأسعار
              </a>
            </div>

            <div className="bg-gray-100/50 backdrop-blur-sm border border-gray-300 rounded-2xl p-8 max-w-3xl mx-auto">
              <div className="text-right mb-6">
                <div className="text-gray-500 text-sm mb-2">تجربة الصوت الحالي:</div>
                <div className="text-2xl font-bold text-gray-900">{voiceExamples[currentVoice].name} - {voiceExamples[currentVoice].dialect}</div>
              </div>
              
              <div className="bg-gray-200/50 rounded-xl p-6 text-lg leading-relaxed mb-6 border-r-4 border-blue-500 text-gray-800">
                {voiceExamples[currentVoice].text}
              </div>
              
              <div className="flex justify-center gap-3 mb-6">
                {voiceExamples.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      index === currentVoice ? 'bg-blue-500 scale-125' : 'bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={handlePlayDemo}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 flex items-center justify-center"
              >
                <Play className={`ml-2 h-4 w-4 ${isPlaying ? 'animate-spin' : ''}`} />
                {isPlaying ? 'جاري التشغيل...' : 'تشغيل العينة'}
              </button>
            </div>
          </div>
        </section>

        {/* 2. API Features */}
        <section className="relative z-10 py-20 px-6 bg-gray-100/50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Easy to use APIs that scale</h2>
            <p className="text-xl text-gray-700 mb-16 max-w-3xl mx-auto">
              نماذج الصوت الذكي الرائدة، قوية وقابلة للتوسع وسريعة التكامل.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200/50 transition-colors">
                  <Code className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Python and TypeScript SDKs</h3>
                <p className="text-gray-600">انتقل إلى الإنتاج بسرعة</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200/50 transition-colors">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">GDPR & SOC II compliant</h3>
                <p className="text-gray-600">آمن ومتوافق</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-white/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-200/50 transition-colors">
                  <Database className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Enterprise Ready</h3>
                <p className="text-gray-600">مصمم للمؤسسات الكبيرة</p>
              </div>
            </div>
            
            <div className="mt-12">
              <a href="/docs" className="inline-flex items-center justify-center px-8 py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
                READ THE DOCS
              </a>
            </div>
          </div>
        </section>

        {/* --- [NEW SECTION 3] كيف يعمل الإستوديو؟ (Demo/Walkthrough) --- */}
        <section className="relative z-10 py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">ابدأ إنتاجك الاحترافي في 3 خطوات</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-right">
              
              <div className="relative p-6 border-t-4 border-blue-600 bg-gray-50 rounded-lg shadow-lg">
                <span className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xl font-extrabold w-10 h-10 rounded-full flex items-center justify-center border-4 border-white">1</span>
                <div className="flex items-center justify-end mb-4">
                    <Mic className="w-8 h-8 text-blue-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">اختر صوتك ونمطك</h3>
                </div>
                <p className="text-gray-700">أضف النصوص الخاصة بك، ثم اختر صوتاً من الأصوات الاحترافية (`Pro`) التي تضمن أعلى جودة تشكيل ودقة في النطق.</p>
              </div>
              
              <div className="relative p-6 border-t-4 border-green-600 bg-gray-50 rounded-lg shadow-lg">
                <span className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xl font-extrabold w-10 h-10 rounded-full flex items-center justify-center border-4 border-white">2</span>
                <div className="flex items-center justify-end mb-4">
                    <Edit className="w-8 h-8 text-green-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">حرر صوتك بالكامل</h3>
                </div>
                <p className="text-gray-700">استخدم شريط الزمن التفاعلي لقص المقاطع، حذف الأجزاء غير المرغوب فيها، وتطبيق التشكيل الآلي المتقدم.</p>
              </div>
              
              <div className="relative p-6 border-t-4 border-purple-600 bg-gray-50 rounded-lg shadow-lg">
                <span className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-xl font-extrabold w-10 h-10 rounded-full flex items-center justify-center border-4 border-white">3</span>
                <div className="flex items-center justify-end mb-4">
                    <Download className="w-8 h-8 text-purple-600 ml-3" />
                    <h3 className="text-xl font-bold text-gray-900">دمج وتنزيل فوري</h3>
                </div>
                <p className="text-gray-700">قم بدمج جميع المقاطع التي أنشأتها في ملف MP3 واحد عالي الجودة، جاهز للاستخدام الفوري في مشاريعك.</p>
              </div>

            </div>
          </div>
        </section>
        
        {/* --- [NEW SECTION 4] مقارنة Free vs Pro --- */}
        <section className="relative z-10 py-20 px-6 bg-gray-100/50">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-12">قارن الميزات: المجاني مقابل الاحترافي</h2>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 text-right">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700">
                                <th className="px-6 py-4 text-lg font-bold text-gray-800 dark:text-white border-l border-gray-200 dark:border-gray-600">الميزة</th>
                                <th className="px-6 py-4 text-lg font-bold text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-600">الخطة المجانية</th>
                                <th className="px-6 py-4 text-lg font-bold text-blue-600 dark:text-blue-400">الخطة الاحترافية (Pro)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Row 1: المدة/الرصيد */}
                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-600">مدة الصوت/الرصيد</td>
                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 border-l border-gray-200 dark:border-gray-600">15 دقيقة شهرياً</td>
                                <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">ساعة كاملة (60 دقيقة)</td>
                            </tr>
                            {/* Row 2: جودة التشكيل */}
                            <tr className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-600">جودة التشكيل الآلي</td>
                                <td className="px-6 py-4 text-red-500 dark:text-red-400 border-l border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
                                    أساسي أو لا يوجد
                                </td>
                                <td className="px-6 py-4 font-bold text-blue-600 dark:text-blue-400 flex items-center justify-end gap-2">
                                    <Star className="w-5 h-5" /> تشكيل آلي متقدم (Pro)
                                </td>
                            </tr>
                            {/* Row 3: تحرير الشريط الزمني */}
                            <tr className="border-t border-gray-100 dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-600">تحرير الشريط الزمني (Timeline)</td>
                                <td className="px-6 py-4 text-red-500 dark:text-red-400 border-l border-gray-200 dark:border-gray-600">لا يوجد</td>
                                <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400 flex items-center justify-end gap-2">
                                    <CheckCircle className="w-5 h-5" /> قص وحذف المقاطع
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        {/* 5. Final CTA Section */}
        <section className="relative z-10 py-20 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              ابدأ تجربتك مع أول
              <span className="block mt-2">AI Studio عربي اليوم</span>
            </h2>
            
            <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
              انضم إلى آلاف صناع المحتوى الذين يثقون في منصتنا لإنتاج محتوى صوتي استثنائي
            </p>
            
            <a
              href={projectLink}
              className="group inline-flex items-center justify-center px-16 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              جرّب مجانًا الآن
              <ArrowLeft className="ml-4 h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            
            <p className="text-sm text-gray-500 mt-6">
              لا حاجة لبطاقة ائتمان • ابدأ خلال دقائق
            </p>
          </div>
        </section>

        {/* 6. Clients Section */}
        <section className="relative z-10 py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-500 mb-12">Our Clients</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <Image src="/logos/ghaymah.jpg" alt="ghaymah" width={128} height={128} className="mx-auto transition-transform duration-300 ease-in-out hover:scale-110" />
              </div>
              <div className="text-center">
                <Image src="/logos/ilibrary.jpg" alt="ilibrary" width={128} height={128} className="mx-auto transition-transform duration-300 ease-in-out hover:scale-110" />
              </div>
              <div className="text-center">
                <Image src="/logos/solid-point.jpg" alt="SOLID POINT" width={128} height={128} className="mx-auto transition-transform duration-300 ease-in-out hover:scale-110" />
              </div>
            </div>
          </div>
        </section>

        {/* [NEW] شريط ثابت أسفل الشاشة (Sticky Bar) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl transition-shadow duration-300">
            <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-gray-800 font-semibold hidden md:block">
                    ابدأ تجربتك المجانية اليوم!
                </div>
                <div className="flex flex-1 justify-end gap-4">
                     <a 
                        href="/pricing"
                        className="inline-flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded-lg transition-all"
                      >
                        <DollarSign className={`ml-2 h-4 w-4`} />
                        شاهد جميع الخطط والأسعار
                      </a>
                      <a
                        href={projectLink}
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-md transition-all"
                      >
                        ابدأ مجانًا
                      </a>
                </div>
            </div>
        </div>


        {/* 7. Footer */}
        <footer className="relative z-10 border-t border-gray-200 py-12 px-6 bg-gray-100">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              ai voice studio
            </div>
            <div className="flex justify-center space-x-4 rtl:space-x-reverse mb-4 text-gray-600 text-sm">
                <a href="/legal" className="hover:text-blue-600 transition-colors">Legal Policies</a>
                <a href="/about" className="hover:text-blue-600 transition-colors">About Us</a>
                <a href="/docs" className="hover:text-blue-600 transition-colors">Docs</a>
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 ai voice studio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
}