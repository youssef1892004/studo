'use client';
import { useState, useEffect } from "react";
import { ArrowLeft, Play, Mic, Globe, Zap, Users, Star, CheckCircle } from "lucide-react";

export default function LandingPage() {
  // Simulate auth context - replace with your actual auth context
  const user = null; // Replace with your authContext?.user
  const projectLink = user ? "/projects" : "/login";
  
  const [currentVoice, setCurrentVoice] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const voiceExamples = [
    { name: "أحمد", dialect: "مصري", text: "مرحباً بكم في أول استوديو صوتي عربي بالذكاء الاصطناعي" },
    { name: "فاطمة", dialect: "سعودي", text: "حوّل نصوصك إلى أصوات طبيعية وواقعية" },
    { name: "محمد", dialect: "مغربي", text: "ابدأ تجربتك الآن وأنشئ محتوى صوتي مميز" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVoice((prev) => (prev + 1) % voiceExamples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayDemo = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gray-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-gray-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 lg:px-12 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent">
          AI Studio العربي
        </div>
        <div className="flex gap-4">
          <button className="text-gray-600 hover:text-gray-800 transition-colors duration-300">
            المنصة
          </button>
          <button className="text-gray-600 hover:text-gray-800 transition-colors duration-300">
            الأسعار
          </button>
          <button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105">
            تسجيل الدخول
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent leading-tight animate-fade-in-down">
            أول موقع في الوطن العربي
            <span className="block mt-4">متخصص في AI Studio</span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up opacity-0" style={{animationDelay: '0.3s'}}>
            حوّل أفكارك لمحتوى صوتي ومرئي احترافي بدعم الذكاء الاصطناعي.
            <span className="block mt-2">إنتاج سريع دون الحاجة لمعدات أو خبرة تقنية.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in-scale opacity-0" style={{animationDelay: '0.6s'}}>
            <a
              href={projectLink}
              className="group inline-flex items-center justify-center px-12 py-5 bg-black text-white font-bold text-xl rounded-2xl shadow-lg hover:bg-gray-800 transition-all duration-500 transform hover:scale-105 animate-float"
            >
              ابدأ الآن مجانًا
              <ArrowLeft className="ml-3 h-6 w-6 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            
            <button 
              onClick={handlePlayDemo}
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-gray-800 text-gray-800 font-bold text-lg rounded-2xl hover:bg-gray-800 hover:text-white transition-all duration-300"
            >
              <Play className={`ml-2 h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
              استمع للعينة
            </button>
          </div>

          {/* Voice Demo Section */}
          <div className="bg-white shadow-xl rounded-3xl p-8 max-w-3xl mx-auto border border-gray-200 animate-fade-in-up opacity-0" style={{animationDelay: '0.9s'}}>
            <div className="text-right mb-6">
              <div className="text-gray-500 text-sm mb-2">تجربة الصوت الحالي:</div>
              <div className="text-2xl font-bold text-gray-800">{voiceExamples[currentVoice].name} - {voiceExamples[currentVoice].dialect}</div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 text-lg leading-relaxed mb-6 border-r-4 border-gray-800 text-gray-700">
              {voiceExamples[currentVoice].text}
            </div>
            
            <div className="flex justify-center gap-4 mb-4">
              {voiceExamples.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    index === currentVoice ? 'bg-gray-800 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button 
              onClick={handlePlayDemo}
              className="w-full py-4 bg-gray-800 hover:bg-black text-white rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105"
            >
              <Play className={`ml-2 h-5 w-5 ${isPlaying ? 'animate-pulse' : ''}`} />
              {isPlaying ? 'جاري التشغيل...' : 'تشغيل العينة'}
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent animate-fade-in-up">
            مميزات المنصة
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🎙️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">أكثر من 300 صوت</h3>
              <p className="text-gray-600 leading-relaxed">مكتبة ضخمة من الأصوات المتنوعة والمميزة</p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🌍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">40+ دولة</h3>
              <p className="text-gray-600 leading-relaxed">تنوع عالمي يغطي جميع أنحاء الوطن العربي</p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🔥</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">دعم عربي كامل</h3>
              <p className="text-gray-600 leading-relaxed">جودة طبيعية واحترافية باللغة العربية</p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">⚡</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">أداة شاملة</h3>
              <p className="text-gray-600 leading-relaxed">تسجيل، مونتاج، وتصدير بجودة عالية</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="relative z-10 py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-16 bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent animate-fade-in-up">
            لماذا نحن؟
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="space-y-6 group animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="bg-gray-200 backdrop-blur-lg rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:bg-gray-800 transition-all duration-500 transform group-hover:scale-110">
                <Globe className="w-10 h-10 text-gray-800 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">مكتبة أصوات واقعية</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                نوفر لك مكتبة أصوات واقعية من كل بلد عربي بجودة لا تضاهى
              </p>
            </div>
            
            <div className="space-y-6 group animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="bg-gray-200 backdrop-blur-lg rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:bg-gray-800 transition-all duration-500 transform group-hover:scale-110">
                <Zap className="w-10 h-10 text-gray-800 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">إنتاج سريع</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                إنتاج سريع دون الحاجة لمعدات أو خبرة تقنية معقدة
              </p>
            </div>
            
            <div className="space-y-6 group animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="bg-gray-200 backdrop-blur-lg rounded-full w-20 h-20 flex items-center justify-center mx-auto group-hover:bg-gray-800 transition-all duration-500 transform group-hover:scale-110">
                <Star className="w-10 h-10 text-gray-800 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">تكلفة أقل</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                تكلفة أقل من الاستوديو التقليدي بجودة تضاهي المحترفين
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="relative z-10 py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800 animate-fade-in-up">
            موثوق به من صناع محتوى في أكثر من 40 دولة
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Placeholder for logos - replace with actual client logos */}
            <div className="bg-gray-100 rounded-xl p-6 h-20 flex items-center justify-center hover:bg-gray-200 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <div className="text-gray-700 font-bold">شركة 1</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6 h-20 flex items-center justify-center hover:bg-gray-200 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <div className="text-gray-700 font-bold">شركة 2</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6 h-20 flex items-center justify-center hover:bg-gray-200 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              <div className="text-gray-700 font-bold">شركة 3</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-6 h-20 flex items-center justify-center hover:bg-gray-200 transition-all duration-300 hover:scale-105 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <div className="text-gray-700 font-bold">شركة 4</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 py-20 px-6 text-center bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent leading-tight animate-fade-in-up">
            ابدأ تجربتك مع أول
            <span className="block mt-2">AI Studio عربي اليوم</span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            انضم إلى آلاف صناع المحتوى الذين يثقون في منصتنا لإنتاج محتوى صوتي استثنائي
          </p>
          
          <a
            href={projectLink}
            className="group inline-flex items-center justify-center px-16 py-5 bg-black text-white font-bold text-2xl rounded-2xl shadow-2xl hover:bg-gray-800 transition-all duration-500 transform hover:scale-105 animate-float animate-fade-in-scale" style={{animationDelay: '0.6s'}}
          >
            جرّب مجانًا الآن
            <ArrowLeft className="ml-4 h-7 w-7 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          
          <p className="text-sm text-gray-500 mt-6 animate-fade-in-up" style={{animationDelay: '0.9s'}}>
            لا حاجة لبطاقة ائتمان • ابدأ خلال دقائق
          </p>
        </div>
      </section>

      <style jsx global>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-scale {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-fade-in-scale {
          animation: fade-in-scale 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}