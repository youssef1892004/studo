// src/app/legal/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Lock, DollarSign, Users, Code, Hammer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'السياسات والشروط القانونية',
  description: 'سياسة الخصوصية، شروط الاستخدام، الملكية الفكرية، وسياسة الدفع لمنصة Voice Studio.',
  robots: { index: true, follow: true },
};

// Helper component for policy sections
const PolicySection: React.FC<{ title: string; children: React.ReactNode; icon: React.ReactNode }> = ({ title, children, icon }) => (
    <section className="mb-12 p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="text-3xl font-bold mb-4 flex items-center gap-3 text-gray-900 dark:text-white">
            {icon}
            {title}
        </h2>
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            {children}
        </div>
    </section>
);

// Helper component for policy subsections
const PolicySubsection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-xl font-semibold mt-6 mb-3 border-b border-gray-300 dark:border-gray-600 pb-1 text-gray-800 dark:text-gray-100">{title}</h3>
        {children}
    </div>
);

export default function LegalPage() {
    return (
        <div className="min-h-screen pt-16 bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            <div className="max-w-5xl mx-auto p-8">
                
                <Link 
                    href="/" 
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
                >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    العودة إلى الرئيسية
                </Link>
                
                <h1 className="text-5xl font-extrabold mb-8 text-gray-900 dark:text-white">
                    السياسات والشروط القانونية
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
                    **آخر تحديث: 02/10/2025** - يرجى مراجعة هذه الوثائق بدقة. استخدامك للخدمة يعني موافقتك على جميع البنود أدناه.
                </p>

                {/* --- 1. سياسة الخصوصية --- */}
                <PolicySection title="سياسة الخصوصية" icon={<Lock className="w-8 h-8 text-green-600 dark:text-green-400" />}>
                    <p>نحن نحترم خصوصيتك ونلتزم بحماية معلوماتك الشخصية. تنطبق هذه السياسة على جميع الخدمات التي تقدمها  عبر موقع Voice Studio وخدمات الواجهات البرمجية.</p>

                    <PolicySubsection title="1.1 جمع البيانات">
                        <ul className="list-disc list-inside space-y-2">
                            <li>**بيانات الحساب:** الاسم، البريد الإلكتروني، بيانات الفوترة والدفع (عند الاشتراك).</li>
                            <li>**مدخلات المستخدم:** النصوص التي تدخلها، الملفات الصوتية التي ترفعها، أي بيانات منتجة (مخرجات صوتية).</li>
                            <li>**بيانات تقنية:** عنوان IP، نوع المتصفح / الجهاز، سجلات الاستخدام، معرفات الأداء (logs).</li>
                            <li>**ملفات تعريف الارتباط (كوكيز):** كوكيز ضرورية وتحليلية ووظائفية (تفصيل في سياسة الكوكيز المرفقة).</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.2 استخدام البيانات">
                        <ul className="list-disc list-inside space-y-2">
                            <li>تشغيل الخدمة وتسليم المخرجات الصوتية للمستخدم.</li>
                            <li>تحسين نماذج الذكاء الاصطناعي (التدريب والتحليل الإحصائي بما يحترم خصوصية البيانات).</li>
                            <li>الأمن ومنع الاحتيال ومكافحة إساءة الاستخدام.</li>
                            <li>التواصل الإداري، إشعارات النظام، وتنبيهات الحساب.</li>
                        </ul>
                    </PolicySubsection>
                    
                    <PolicySubsection title="1.3 مشاركة البيانات">
                        <p>لا نبيع بيانات المستخدمين أو نؤجرها. قد نشارك أجزاء من البيانات مع:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>مزودي خدمات الدفع (Pay Mob أو Accept) لمعالجة المعاملات.</li>
                            <li>مزودي الاستضافة والسحابة (Ghayma Systems) وفق اتفاقيات معالجة بيانات (DPA).</li>
                            <li>مزودي التحليلات أو خدمات الدعم التقني لضمان تشغيل الخدمة.</li>
                        </ul>
                    </PolicySubsection>
                    
                    <PolicySubsection title="1.4 الاحتفاظ والأمن">
                        <ul className="list-disc list-inside space-y-2">
                            <li>نحتفظ بالبيانات فقط للفترة اللازمة لتقديم الخدمة أو للالتزامات القانونية، ثم نقوم بحذفها أو إخفاء هويتها.</li>
                            <li>نطبق ضوابط أمنية تقنية وإدارية: التشفير أثناء النقل (TLS 1.2/1.3)، تشفير قواعد البيانات عند الحاجة، وضوابط وصول مبنية على الدور.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="1.5 حقوق المستخدمين">
                        <p className="font-semibold text-sm">(خاصة بمستخدمي الاتحاد الأوروبي)</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>الحق في الوصول، التصحيح، المحو (حق النسيان)، تقييد المعالجة، ونقل البيانات.</li>
                            <li>لسحب الموافقة إن اعتمدت المعالجة بناءً عليها، مع الإشارة إلى أن سحب الموافقة لا يؤثر على قانونية المعالجات السابقة.</li>
                            <li>للشكاوى يمكن الاتصال بمسؤول حماية البيانات على ghaymah.systems أو تقديم شكوى لدى سلطة الحماية المحلية.</li>
                        </ul>
                    </PolicySubsection>
                </PolicySection>
                
                {/* --- 2. شروط الاستخدام --- */}
                <PolicySection title="شروط الاستخدام" icon={<BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />}>
                    <p>تنظم هذه الشروط العلاقة بين المستخدم و Voice Studio: باستخدامك للخدمة، تكون قد قبلت هذه الشروط وسياسة الخصوصية والسياسات ذات الصلة.</p>
                    
                    <PolicySubsection title="2.1 الأهلية">
                        <p>يجب أن تكون قادراً قانونياً على إبرام عقد. لا توجه الخدمة للأطفال دون سن القانون المحلي (عادة 13 عاماً أو أعلى).</p>
                    </PolicySubsection>

                    <PolicySubsection title="2.2 الوصول والاستخدام المسموح">
                        <ul className="list-disc list-inside space-y-2">
                            <li>تمنح للمستخدمين ترخيصاً محدوداً غير حصري لاستخدام الواجهة والخدمات وفقاً لهذه الشروط.</li>
                            <li>تظل ملكية المدخلات (النصوص) للمستخدم، بينما تمنح Voice Studio ترخيصاً مؤقتاً لمعالجتها لأغراض تشغيل الخدمة وتحسينها.</li>
                            <li>المخرجات الصوتية مرخصة للاستخدام وفق الخطة المشتراة ونطاق الترخيص الموضح في لوحة التحكم.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="2.3 القيود والامتناع">
                        <p>يحظر على المستخدم:</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li>محاولة عكس هندسة الأنظمة (Reverse Engineering) أو استنساخ النماذج.</li>
                            <li>استخدام الخدمة لارتكاب جرائم أو نشر محتوى يخالف القوانين أو ينتهك حقوق الغير.</li>
                            <li>مشاركة مفاتيح API أو استخدام المفاتيح بطريقة تؤدي لإساءة الاستخدام.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="2.4 التعويض وحدود المسؤولية">
                        <p>يتعهد المستخدم بتعويض الشركة عن أية مطالبات ناتجة عن خرق هذه الشروط. مسؤولية الشركة محدودة إلى أقصى حد يسمح به القانون، وقد تحدد بحسب الرسوم المدفوعة في آخر 12 شهراً.</p>
                    </PolicySubsection>

                    <PolicySubsection title="2.5 التعديلات والإنهاء">
                        <ul className="list-disc list-inside space-y-2">
                            <li>نحتفظ بالحق في تعديل هذه الشروط في أي وقت مع نشر التغييرات. استمرار الاستخدام بعد التعديل يعني الموافقة.</li>
                            <li>يمكن للشركة تعليق أو إنهاء الحسابات في حالة الخروقات الجسيمة.</li>
                        </ul>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 3. سياسة الملكية الفكرية --- */}
                <PolicySection title="سياسة الملكية الفكرية" icon={<Code className="w-8 h-8 text-purple-600 dark:text-purple-400" />}>
                    <PolicySubsection title="3.1 ملكية المنصة">
                        <p>جميع الحقوق المتعلقة بالبرمجيات، النماذج، الخوارزميات، الكود المصدري والشعارات محفوظة لـ Voice Studio أو المرخصين لها.</p>
                    </PolicySubsection>
                    
                    <PolicySubsection title="3.2 حقوق المستخدم في المدخلات والمخرجات">
                        <ul className="list-disc list-inside space-y-2">
                            <li>تبقى نصوصك وملفاتك الخاصة مملوكة لك، وتمنح الشركة ترخيصاً لتقديم الخدمة.</li>
                            <li>المخرجات الصوتية مرخصة للاستخدام بناءً على الخطة المتفق عليها. يحتفظ الموفر بحق فرض قيود على إعادة البيع أو التوزيع حسب البنود التجارية.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="3.3 إخطار الانتهاك وإزالة المحتوى">
                        <p>في حال تلقي إخطار قانوني (مثل DMCA) بانتهاك حقوق، سنراجع الإخطار وقد نزيل المحتوى أو نقيد الوصول وفق الإجراءات القانونية السارية.</p>
                    </PolicySubsection>
                </PolicySection>
                
                {/* --- 4. سياسة الاستخدام المقبول --- */}
                <PolicySection title="سياسة الاستخدام المقبول" icon={<Hammer className="w-8 h-8 text-red-600 dark:text-red-400" />}>
                    <PolicySubsection title="4.1 ممارسات محظورة">
                        <ul className="list-disc list-inside space-y-2">
                            <li>استخدام الخدمة لتوليد أو نشر محتوى يحض على العنف أو الإرهاب أو الكراهية أو الاستغلال الجنسي.</li>
                            <li>انتحال هوية أشخاص حقيقيين أو شخصيات عامة بدون موافقة واضحة ومكتوبة.</li>
                            <li>إنشاء أو توزيع مواد مزيفة (deepfakes) بقصد الاحتيال أو التشهير.</li>
                            <li>استغلال المنصة في عمليات احتيال مالي أو مكالمات صوتية مزيفة.</li>
                            <li>رفع ملفات ضارة أو محاولة اختراق خدماتنا أو خدمات الآخرين.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="4.2 المراقبة والإجراءات التصحيحية">
                        <p>نطبق نظم مراقبة آلية لاكتشاف إساءة الاستخدام. عند الاشتباه في خرق السياسة سنقوم بالتدرج (تحذير - تعليق مؤقت - إغلاق دائم للحساب) مع إمكانية التبليغ عن الجهات القانونية.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 5. سياسة الدفع واسترداد الأموال --- */}
                <PolicySection title="سياسة الدفع واسترداد الأموال" icon={<DollarSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />}>
                    <PolicySubsection title="5.1 الفوترة والرسوم">
                        <ul className="list-disc list-inside space-y-2">
                            <li>تقدم الخدمات عبر خطط اشتراك شهرية / سنوية أو نموذج ائتماني باستهلاك.</li>
                            <li>تحتسب الضرائب المحلية بحسب موقع الفوترة وقد تُضاف تلقائياً إلى الفاتورة.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="5.2 سياسة الاسترداد">
                        <ul className="list-disc list-inside space-y-2">
                            <li>يمكن طلب استرداد خلال سبعة (7) أيام من الدفع إذا لم يتجاوز استهلاك الخدمة نسبة 10% من رصيد الخطة.</li>
                            <li>في حال إثبات وجود خلل تقني من جانبنا من شأنه منع الاستخدام، قد نمنح استرداداً كلياً أو جزئياً بحسب حجم التأثر.</li>
                            <li>لا تعاد الأموال في حالات الإساءة أو خرق الشروط أو تجاوز حدود الاستخدام المتفق عليها.</li>
                        </ul>
                    </PolicySubsection>
                    
                    <PolicySubsection title="5.3 آليات إعادة الأموال">
                        <p>طلبات الاسترداد تقدم عبر دعم العملاء مع إرفاق رقم الفاتورة وتفاصيل المشكلة. مدة المعالجة قد تستغرق حتى 14 يوماً مصرفياً.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 6. سياسات ما بعد البيع وخدمات الدعم --- */}
                <PolicySection title="سياسات ما بعد البيع وخدمات الدعم" icon={<Users className="w-8 h-8 text-teal-600 dark:text-teal-400" />}>
                    <PolicySubsection title="6.1 الدعم الفني">
                        <ul className="list-disc list-inside space-y-2">
                            <li>قنوات الدعم: نظام تذاكر، بريد إلكتروني للدعم، وفي باقات المؤسسات إمكانية دعم SLA مخصص.</li>
                            <li>مهل الاستجابة العامة: الرد الأولي خلال 24-48 ساعة عمل. الحالات الحرجة تعالج حسب اتفاق SLA.</li>
                        </ul>
                    </PolicySubsection>

                    <PolicySubsection title="6.2 الصيانة والتحديثات">
                        <ul className="list-disc list-inside space-y-2">
                            <li>يحتمل إجراء تحديثات دورية أو تغييرات في واجهات API. سنبلغ المؤثرين بالتغييرات الجوهرية قبل 15 يوماً على الأقل.</li>
                            <li>التحديثات الأمنية الطارئة قد تُطبق فوراً دون إشعار لتأمين الخدمة.</li>
                        </ul>
                    </PolicySubsection>
                    
                    <PolicySubsection title="6.3 الشكاوى وتسوية النزاعات">
                        <ul className="list-disc list-inside space-y-2">
                            <li>على العميل تقديم شكوى مكتوبة خلال 7 أيام من وقوع المشكلة، مع تفاصيل ودلائل.</li>
                            <li>الشركة تلتزم بالتحقيق والرد خلال 15 يوم عمل، ومحاولة حل ودي قبل اللجوء إلى تسوية قانونية.</li>
                        </ul>
                    </PolicySubsection>
                    
                    <PolicySubsection title="6.4 إنهاء الخدمة وما بعده">
                        <p>عند إنهاء الحساب: نحتفظ ببيانات المستخدم لمدة 30 يوماً لإتاحة تنزيل المخرجات. بعد انقضاء هذه المهلة تحذف البيانات نهائياً ما لم يكن هناك التزام قانوني يفرض الاحتفاظ.</p>
                    </PolicySubsection>
                </PolicySection>

                {/* --- 7. القوة القاهرة --- */}
                <PolicySection title="7. القوة القاهرة (Force Majeure)" icon={<Hammer className="w-8 h-8 text-gray-600 dark:text-gray-400" />}>
                    <p>لا يتحمل أي طرف المسؤولية عن إخفاق التنفيذ أو تأخيره نتيجة أحداث خارجة عن السيطرة المعقولة مثل: الكوارث الطبيعية، الإغلاقات الحكومية، الحروب، الشغب، الحرائق، انقطاع شبكات الاتصال، أو أي ظروف أخرى تعد قوة قاهرة. يجب إخطار الطرف الآخر خلال 14 يوماً من حدوث الحدث.</p>
                </PolicySection>

                {/* --- 8. القانون والاختصاص القضائي --- */}
                <PolicySection title="8. القانون والاختصاص القضائي" icon={<BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />}>
                    <p>تخضع هذه السياسات وتفسر وفقاً لقوانين **مصر**. في حال النزاع تختص محاكم **Al Arish** دون الإخلال بأي حقوق قانونية قد يتمتع بها الطرفان في ولايات قضائية أخرى.</p>
                </PolicySection>

                {/* --- 9. معلومات الاتصال --- */}
                <PolicySection title="9. معلومات الاتصال" icon={<Users className="w-8 h-8 text-pink-600 dark:text-pink-400" />}>
                    <p>للاستفسارات، الشكاوى، طلبات حقوق البيانات، أو إخطار بانتهاك الملكية الفكرية، الرجاء التواصل عبر:</p>
                    <ul className="list-disc list-inside space-y-2 font-mono">
                        <li>**البريد الإلكتروني العام:** aivoicestudio.s@gmail.com</li>
                        <li>**مسؤول حماية البيانات:** ghaymah.systems .</li>
                        <li>**العنوان:** القاهرة، مصر</li>
                    </ul>
                </PolicySection>

            </div>
        </div>
    );
}