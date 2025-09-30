import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Zap, Users, Code } from 'lucide-react';

export const metadata: Metadata = {
  title: 'من نحن | Studio',
  description: 'تعرف على فريق ورؤية Studio، المشروع الرائد لتحويل النص إلى كلام عربي. تم تطويره بواسطة شركة غيمة لتمكين صناع المحتوى بأصوات عربية دقيقة.',
  keywords: ['عن Studio', 'فريق Studio', 'شركة غيمة', 'قيس', 'يوسف عيسى', 'طارق أحمد', 'عبد الصبور السبيعي', 'رؤية Studio', 'تقنيات Studio'],
  openGraph: {
    title: 'من نحن | Studio',
    description: 'تعرف على الفريق، الرؤية، والتقنيات خلف Studio، منصة الذكاء الاصطناعي الصوتية الرائدة في العالم العربي.',
    url: 'https://www.voicestudio.space/about',
  },
  twitter: {
    title: 'من نحن | Studio',
    description: 'تعرف على الفريق، الرؤية، والتقنيات خلف Studio، منصة الذكاء الاصطناعي الصوتية الرائدة في العالم العربي.',
  },
};

export default function AboutPage() {
  return (
    // الخلفية والتنسيقات الأساسية للوضع الداكن/الفاتح
    <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">
        
        {/* زر العودة إلى الرئيسية */}
        <Link 
            href="/" 
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة إلى الرئيسية
        </Link>
        
        <h1 className="text-4xl font-bold mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
            حول تطبيق Studio
        </h1>
        
        {/* === القسم الأول: الرؤية والقيادة (تم التعديل) === */}
        <section className="mb-10 p-6 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
             <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             القيادة والرؤية
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
                تم إنشاء هذا المشروع بواسطة <span className="text-blue-600 dark:text-blue-400">شركة غيمة</span> تحت الإشراف المباشر للمهندس <span className="text-blue-600 dark:text-blue-400">قيس</span>.
            </p>
            <p>
                رؤيتنا هي تمكين صانعي المحتوى والشركات من إنتاج محتوى صوتي احترافي بأكثر من 30 لهجة عربية دون الحاجة لمعدات تسجيل معقدة أو خبرة تقنية متقدمة.
            </p>
            <p>
                نحن نؤمن بأن الذكاء الاصطناعي يجب أن يكون أداة إبداعية متاحة للجميع، وأن اللغة العربية تستحق أفضل النماذج الصوتية وأكثرها دقة وواقعية.
            </p>
          </div>
        </section>

        {/* === القسم الثاني: التقنية المستخدمة === */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
             <Code className="w-6 h-6 text-green-600 dark:text-green-400" />
             التقنيات الأساسية
          </h2>
          <div className="space-y-4 text-gray-700 dark:text-gray-300">
            <ul className="list-disc list-inside p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <li>**Next.js & TypeScript:** الواجهة الأمامية القوية لضمان الأداء والسرعة.</li>
                <li>**Hasura & PostgreSQL:** لإدارة بيانات المستخدمين والمشاريع بكفاءة وأمان.</li>
                <li>**FFmpeg:** لمعالجة ودمج المقاطع الصوتية على الخادم أثناء التصدير.</li>
                <li>**خدمة TTS الخارجية:** نوفر اتصالاً آمناً بـ API متقدم لتوليد الكلام العربي.</li>
            </ul>
          </div>
        </section>
        
        {/* === القسم الثالث: فريق التطوير (تم التعديل) === */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-3">
             <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
             فريق تطوير الموقع
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
             تم عمل هذا الموقع بواسطة:
          </p>
          <ul className="list-disc list-inside pl-4 text-gray-700 dark:text-gray-300 space-y-1">
             <li className="font-medium">يوسف عيسى</li>
             <li className="font-medium">طارق أحمد</li>
             <li className="font-medium">عبد الصبور السبيعي</li>
          </ul>
        </section>
        
      </div>
    </div>
  );
}