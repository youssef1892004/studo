// src/app/page.tsx
'use client';
import { useState, useEffect, useRef, useContext, useMemo } from "react";
import { ArrowLeft, Play, Mic, Globe, Zap, Star, CheckCircle, Code, Database, Users, Shield } from "lucide-react";
import { AuthContext } from '@/contexts/AuthContext'; 
import CountUpOnScroll from '@/components/CountUpOnScroll';
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
        { name: "فاطمة", dialect: "سعودي", 
            text: "مرحباً بك في محرر الصوت", 
            audioUrl: "/generated_audio/2.mp3" 
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
        if (!isPlaying && currentVoice === voiceExamples.length - 1) {
            setCurrentVoice(0); 
        }
        setIsPlaying(prev => !prev);
    };

    return (
      <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
        <audio ref={audioRef} />

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

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <a
                href={projectLink}
                className="group inline-flex items-center justify-center px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                ابدأ الآن مجانًا
                <ArrowLeft className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              
              <button 
                onClick={handlePlayDemo}
                className="group inline-flex items-center justify-center px-8 py-4 border border-gray-400 text-gray-700 hover:text-gray-900 hover:border-gray-500 font-medium text-lg rounded-xl transition-all duration-300"
              >
                <Play className={`ml-2 h-5 w-5 ${isPlaying ? 'animate-spin' : ''}`} />
                {isPlaying ? 'جاري التشغيل...' : 'استمع للعينة'}
              </button>
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

        <footer className="relative z-10 border-t border-gray-200 py-12 px-6 bg-gray-100">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Arabic AI Studio
            </div>
            <div className="text-gray-600 text-sm">
              © 2024 Arabic AI Studio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
}