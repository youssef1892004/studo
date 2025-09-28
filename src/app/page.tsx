// src/app/page.tsx
'use client';
import { useState, useEffect, useRef, useContext } from "react";
import { ArrowLeft, Play, Mic, Globe, Zap, Star, CheckCircle, Code, Database, Users, Shield } from "lucide-react";
import { AuthContext } from '@/contexts/AuthContext'; // <--- تم إضافة استيراد سياق المصادقة

export default function LandingPage() {
    // جلب حالة المستخدم لتحديد مسار الرابط
    const authContext = useContext(AuthContext);
    const user = authContext?.user;
    const projectLink = user ? "/projects" : "/login"; // <--- استخدام حالة المستخدم الفعلية

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentVoice, setCurrentVoice] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const voiceExamples = [
      { name: "أحمد", dialect: "مصري", text: "أول موقع في الوطن العربي متخصص في AI Studio", audioUrl: "/generated_audio/merged-47ac5144-1e9c-4712-ad8f-40feb7541eaf.mp3" },
      { name: "فاطمة", dialect: "سعودي", text: "مرحباً بك في محرر الصوت", audioUrl: "/generated_audio/merged-a7df6e07-da39-4f5a-b5ae-b0ec230b5c28.mp3" },
      { name: "محمد", dialect: "مغربي", text: "مرحباً بك في مشروعك الجديد", audioUrl: "/generated_audio/merged-1a1cac05-3f53-4f8b-9302-7894a646a0b8.mp3" }
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentVoice((prev) => (prev + 1) % voiceExamples.length);
        if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
      }, 4000);
      return () => clearInterval(interval);
    }, [voiceExamples.length]);

    const handlePlayDemo = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
      } else {
        audio.src = voiceExamples[currentVoice].audioUrl;
        audio.load();
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
      setIsPlaying(!isPlaying);
    };
    
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }, []);

    return (
      <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
        {/* Audio Element for Demo Playback */}
        <audio ref={audioRef} />

        {/* Navigation - REMOVED INLINE NAV TO USE GLOBAL NAVBAR */}
        
        {/* Hero Section */}
        <section className="relative z-10 text-center px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              أول موقع في الوطن العربي
              <span className="block mt-4">متخصص في AI Studio</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
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
                className="group inline-flex items-center justify-center px-8 py-4 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 font-medium text-lg rounded-xl transition-all duration-300"
              >
                <Play className={`ml-2 h-5 w-5 ${isPlaying ? 'animate-spin' : ''}`} />
                {isPlaying ? 'جاري التشغيل...' : 'استمع للعينة'}
              </button>
            </div>

            {/* Voice Demo Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-3xl mx-auto">
              <div className="text-right mb-6">
                <div className="text-gray-400 text-sm mb-2">تجربة الصوت الحالي:</div>
                <div className="text-2xl font-bold text-white">{voiceExamples[currentVoice].name} - {voiceExamples[currentVoice].dialect}</div>
              </div>
              
              <div className="bg-gray-900/50 rounded-xl p-6 text-lg leading-relaxed mb-6 border-r-4 border-blue-500 text-gray-200">
                {voiceExamples[currentVoice].text}
              </div>
              
              <div className="flex justify-center gap-3 mb-6">
                {voiceExamples.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      index === currentVoice ? 'bg-blue-500 scale-125' : 'bg-gray-600'
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

        {/* API Cards Section */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              {/* Text to Speech API Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 group">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Text to Speech API</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    تحويل النص إلى كلام بجودة عالية. اختر من أكثر من 300 صوت عربي متنوع مع دعم كامل للهجات المختلفة.
                  </p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center">
                    <div className="text-blue-400 text-sm font-mono bg-gray-900/50 px-2 py-1 rounded">Arabic Flash</div>
                    <span className="text-gray-400 text-sm mr-3">أداء سريع للاستخدام التفاعلي</span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-purple-400 text-sm font-mono bg-gray-900/50 px-2 py-1 rounded">Arabic Multilingual</div>
                    <span className="text-gray-400 text-sm mr-3">جودة طبيعية متسقة</span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-green-400 text-sm font-mono bg-gray-900/50 px-2 py-1 rounded">Arabic v3</div>
                    <span className="text-gray-400 text-sm mr-3">نموذج تعبيري متقدم</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">300+</div>
                    <div className="text-gray-400 text-sm">صوت عربي</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">15</div>
                    <div className="text-gray-400 text-sm">لهجة محلية</div>
                  </div>
                </div>
              </div>

              {/* Speech to Text API Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 group">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Speech to Text API</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    نموذج التعرف على الكلام الأكثر دقة. تكلفة منخفضة مع دعم اللهجات المختلفة وطوابع زمنية على مستوى الكلمة.
                  </p>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-6 mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">دقة التعرف</div>
                    <div className="text-2xl font-bold text-white">98%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">$0.22</div>
                    <div className="text-gray-400 text-sm">/ساعة صوتية</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">29+</div>
                    <div className="text-gray-400 text-sm">لغة مدعومة</div>
                  </div>
                </div>
              </div>

              {/* Voice Changer API Card */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 hover:border-gray-600 transition-all duration-300 group">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Voice Changer API</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    نموذج تغيير الأصوات الرائد. امنح المستخدمين تحكماً كاملاً في التوقيت والنبرة والعاطفة.
                  </p>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-6 mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500 to-violet-500 animate-spin" style={{animationDuration: '20s'}}></div>
                    <div className="absolute inset-2 bg-gray-900 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors">INPUT</button>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors">OUTPUT</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-white">1000+</div>
                    <div className="text-gray-400 text-sm">أصوات متاحة</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">Real-time</div>
                    <div className="text-gray-400 text-sm">معالجة فورية</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agents Section */}
        <section className="relative z-10 py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left side - Agents info */}
              <div>
                <h2 className="text-4xl font-bold text-white mb-6">Agents</h2>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  ابن ونشر وكلاء صوتيين ذكيين على الويب أو الهاتف المحمول أو الهاتف في دقائق مع زمن استجابة منخفض وقابلية تكوين كاملة.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>زمن استجابة منخفض</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>تبديل متقدم للمتحدثين</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>دعم LLM المخصص</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>استدعاء الوظائف</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>31 لغة مدعومة</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>المكالمات الهاتفية</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 ml-3 flex-shrink-0" />
                    <span>1000s من الأصوات</span>
                  </div>
                </div>
              </div>
              
              {/* Right side - Circular visualization */}
              <div className="flex justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400/20 via-blue-500/20 to-purple-600/20 animate-spin" style={{animationDuration: '20s'}}></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-pink-500/20 via-red-500/20 to-orange-500/20 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
                  <div className="absolute inset-8 rounded-full bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="text-white font-bold text-lg">AI Agents</div>
                      <div className="text-gray-400 text-sm">Ready to Deploy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Easy to use APIs Section */}
        <section className="relative z-10 py-20 px-6 bg-gray-800/30">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Easy to use APIs that scale</h2>
            <p className="text-xl text-gray-300 mb-16 max-w-3xl mx-auto">
              نماذج الصوت الذكي الرائدة، قوية وقابلة للتوسع وسريعة التكامل.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-700/50 transition-colors">
                  <Code className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Python and TypeScript SDKs</h3>
                <p className="text-gray-400">انتقل إلى الإنتاج بسرعة</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-700/50 transition-colors">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">GDPR & SOC II compliant</h3>
                <p className="text-gray-400">آمن ومتوافق</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-gray-700/50 transition-colors">
                  <Database className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Enterprise Ready</h3>
                <p className="text-gray-400">مصمم للمؤسسات الكبيرة</p>
              </div>
            </div>
            
            <div className="mt-12">
              <a href="/docs" className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                READ THE DOCS
              </a>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 py-20 px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent leading-tight">
              ابدأ تجربتك مع أول
              <span className="block mt-2">AI Studio عربي اليوم</span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
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

        {/* Footer */}
        <footer className="relative z-10 border-t border-gray-800 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-6">
              Arabic AI Studio
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 Arabic AI Studio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
}