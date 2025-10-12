
# توثيق المشروع: AI Voice Studio

هذا المستند يشرح مشروع AI Voice Studio بالتفصيل: المعمارية، الإعداد، التدفقات الأساسية، المتغيرات البيئية، وأبرز الواجهات البرمجية.

## 1) نظرة عامة

AI Voice Studio هو تطبيق ويب مبني على `Next.js` لتوليد الصوت العربي الطبيعي من النص باستخدام نماذج TTS. يوفّر تجربة "استوديو" لإدارة المشاريع الصوتية وتقسيم النص إلى كتل، توليد المقاطع، معاينة الأصوات، ودمج النتائج إلى ملف واحد.

- واجهة أمامية: Next.js، React، TypeScript
- أنماط: Tailwind CSS
- إدارة حالة مشتركة: React Context (المصادقة، السمات)
- محرر نص: Editor.js داخل بطاقات الاستوديو
- البيانات: Hasura GraphQL
- التخزين: AWS S3/Wasabi
- الوسائط: `fluent-ffmpeg` مع `ffmpeg-static`

## 2) البدء السريع

### المتطلبات
- Node.js `>=20`
- npm أو yarn

### التثبيت وتشغيل التطوير
- استنسخ المشروع ثم ثبّت الاعتمادات:
  - `git clone <repository-url>`
  - `cd studo && npm install`
- أنشئ ملف `/.env.local` وأضِف المتغيرات البيئية الموضّحة أدناه.
- شغّل الخادم التطويري: `npm run dev` ثم افتح `http://localhost:3000` (أو المنفذ الذي تختاره).

### أهم السكربتات
- `dev`: تشغيل وضع التطوير
- `build`: بناء نسخة الإنتاج
- `start`: تشغيل خادم الإنتاج
- `lint`: تشغيل الفاحص ESLint

## 3) بنية المشروع

```
/
├── public/               # أصول ثابتة (صور، صوت)
├── src/
│   ├── app/              # مسارات الصفحات وواجهات API
│   │   ├── api/          # المسارات الخلفية (TTS، التخزين، التسجيلات)
│   │   ├── (pages)/      # صفحات عامة (تسجيل، مشاريع، إلخ)
│   │   ├── globals.css   # أنماط عامة
│   │   └── layout.tsx    # تخطيط الجذر (مزوّد السياقات)
│   ├── components/       # مكونات واجهة قابلة لإعادة الاستخدام
│   │   ├── studio/       # مكونات صفحة الاستوديو
│   │   └── ui/           # عناصر واجهة عامة
│   ├── contexts/         # سياقات المصادقة والسمات
│   └── lib/              # مساعدات، أنواع، GraphQL، TTS
├── next.config.js        # ضبط Next.js
└── package.json          # الاعتمادات والسكربتات
```

## 4) المعمارية والواجهات الأساسية

### صفحة الاستوديو `src/app/studio/[id]/page.tsx`
- مكوّن عميل: يدير حالة المشروع، البطاقات/الكتل النصية، الأصوات المتاحة، وحالة التوليد.
- تحميل أولي واشتراك: يجلب الكتل من Hasura ويشترك لتحديثات الوقت الحقيقي، ثم يحضّر روابط تشغيل الصوت من Wasabi/S3.
- وظائف رئيسية:
  - `handleGenerate`: توليد مقطع لكل كتلة عبر `/api/tts/generate-segment` ثم الاستعلام الدوري `/api/tts/status/[job_id]` حتى الاكتمال واسترداد النتيجة من `/api/tts/result/[job_id]`.
  - `handleDownloadAll`: يجمع المقاطع إلى ملف واحد عبر `/api/tts/merge-all` باستخدام `ffmpeg`.
- الحفظ التلقائي: مؤقت يحفظ العنوان والمحتوى إلى Hasura عند التغييرات.

### السياقات `src/contexts/*`
- `AuthContext`: يوفّر حالة المستخدم وتوكن JWT، وعمليات `login/logout` مع تخزين محلي.
- `ThemeContext`: يفرض الوضع الفاتح وينسّق الفئة على عنصر `html` ويخزّن التفضيل في `localStorage` لضمان اتساق الواجهة.

### الطبقة الخدمية `src/lib/*`
- `graphql.ts`: استدعاءات Hasura (جلب كتل مشروع، إدراج/تحديث/حذف حسب `block_index`، الاشتراك للتحديثات). تعتمد على `HASURA_GRAPHQL_URL` و`HASURA_ADMIN_SECRET`.
- `tts.ts`: وظائف التعامل مع مزوّد TTS (جلب الأصوات، توليد مقطع، معاينة، رفع نتيجة المقطع). تتكامل مع مسارات `/api/tts/*`.

### التخزين والوسائط
- Wasabi S3 عبر `@aws-sdk/client-s3`:
  - تهيئة العميل باستخدام `AWS_ACCESS_KEY_ID`، `AWS_SECRET_ACCESS_KEY`، `AWS_REGION`، و`AWS_S3_BUCKET_NAME`.
  - نقطة النهاية: `https://s3.eu-south-1.wasabisys.com` (قابلة للتعديل حسب المنطقة).
- توليد روابط تشغيل مؤقتة عبر `GetObjectCommand` و`getSignedUrl` لمدة ساعة.
- الدمج بواسطة `fluent-ffmpeg` مع `ffmpeg-static` لضمان توفر الثنائي في بيئات الاستضافة.

## 5) التكوينات المهمّة

- `next.config.js`:
  - تعطيل فحص ESLint أثناء البناء عند الحاجة: `eslint.ignoreDuringBuilds = true` لتفادي خيارات غير مدعومة.
  - سياسة أمن المحتوى (CSP) ضمن الرؤوس: السماح بـ `blob:` و نطاقات Wasabi/S3 للبث الصوتي.
- `tsconfig.json`:
  - مسارات مختصرة: `@/*` إلى `src/*`.
  - Next.js 15 Typed Routes: توقيعات دوال المسار الديناميكي تتطلب `params: Promise<{...}>`.
- `tailwind.config.js`:
  - `darkMode: 'class'` وتحديد مصادر المحتوى داخل `src/**`.
- `eslint.config.mjs`:
  - تأكد من استخدام إعدادات متوافقة مع ESLint الحديثة وعدم تمرير خيارات مثل `useEslintrc` أو `extensions` إلى CLI.

## 6) المتغيرات البيئية

ضع هذه القيم في `/.env.local` (أو بيئة الاستضافة). المتغيرات التي تبدأ بـ `NEXT_PUBLIC_` يتم تمريرها إلى الواجهة الأمامية (المتصفح) وهي ضرورية للتشغيل السليم.

- Hasura:
  - `NEXT_PUBLIC_HASURA_GRAPHQL_URL`: **(مهم)** عنوان واجهة GraphQL الذي يستخدمه العميل. يجب أن يبدأ بـ `NEXT_PUBLIC_`.
  - `NEXT_PUBLIC_HASURA_ADMIN_SECRET`: **(مهم)** السر الإداري للوصول الآمن من العميل.
  - `HASURA_GRAPHQL_URL`: عنوان الواجهة للاستخدام من جانب الخادم (server-side).
  - `HASURA_ADMIN_SECRET`: السر الإداري للاستخدام من جانب الخادم.
- S3/Wasabi:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_S3_BUCKET_NAME`
- عام/أمامـي (إن لزم):
  - `NEXT_PUBLIC_BASE_URL`: يستخدم في `metadata` والمسارات عند الحاجة

## 7) سير العمل: توليد الصوت

1. المستخدم يحرّر النص داخل بطاقات الاستوديو.
2. لكل بطاقة يتم استدعاء `/api/tts/generate-segment` لاستلام `job_id`.
3. يتم الاستعلام دوريًا `/api/tts/status/[job_id]` حتى اكتمال المعالجة.
4. عند النجاح، يتم جلب الصوت من `/api/tts/result/[job_id]` ثم رفعه إلى Wasabi عبر `/api/project/upload-audio` وتخزين الرابط في Hasura.
5. يتم إنشاء روابط تشغيل موقّتة عبر `/api/project/get-records` لعرضها في واجهة الاستوديو.
6. يمكن دمج كل المقاطع إلى ملف واحد عبر `/api/tts/merge-all`.

## 8) واجهات API

| المسار | الطريقة | الوصف |
| --- | --- | --- |
| `/api/auth/token` | `POST` | مصادقة مستخدم وإرجاع JWT |
| `/api/register` | `POST` | تسجيل مستخدم جديد |
| `/api/project/get-records` | `GET` | جلب أحدث تسجيلات المشروع وتوليد روابط موقّتة للتشغيل |
| `/api/project/upload-audio` | `POST` | رفع ملف صوت Base64 إلى Wasabi وحفظ الرابط في Hasura |
| `/api/voices` | `GET` | جلب قائمة الأصوات المتاحة من مزوّد TTS |
| `/api/tts/create` | `POST` | إنشاء مهمة TTS متعددة الكتل |
| `/api/tts/generate-segment` | `POST` | إنشاء مهمة TTS لكتلة واحدة وإرجاع `job_id` |
| `/api/tts/status/[job_id]` | `GET` | الاستعلام عن حالة المهمة |
| `/api/tts/result/[job_id]` | `GET` | جلب ملف الصوت النهائي للمهمة المكتملة |
| `/api/tts/preview` | `POST` | توليد معاينة قصيرة لصوت محدّد |
| `/api/tts/merge-all` | `POST` | دمج مجموعة من المقاطع إلى MP3 واحد باستخدام ffmpeg |

### مثال: `GET /api/project/get-records`
- طلب: `GET /api/project/get-records?projectId=<uuid>`
- استجابة: مصفوفة سجلات تحتوي `id`, `project_id`, `s3_url` (رابط موقّت)، وربما `error` عند فشل التوقيع.

### مثال: `POST /api/project/upload-audio`
- الجسم: `{ dataUrl: "data:audio/mpeg;base64,...", projectId: "<uuid>" }`
- الاستجابة: `{ persistentAudioUrl: "https://s3.eu-south-1.wasabisys.com/<bucket>/<key>" }`

## 9) ملاحظات التطوير الهامة

- Next.js 15 Typed Routes:
  - عند تعريف دوال مسارات ديناميكية، يجب أن تكون تواقيع مثل `export async function GET(_: Request, { params }: { params: Promise<{ job_id: string }> })` لضمان التوافق مع الأنواع.
- ESLint:
  - إذا ظهرت أخطاء حول خيارات غير معروفة (`useEslintrc`, `extensions`) أثناء البناء، عطّل فحص ESLint في وقت البناء أو حدّث إعداداتك إلى الصياغة الحديثة.
- Wasabi/S3:
  - تأكد من استخدام صيغة رابط صحيحة: `https://<endpoint>/<bucket>/<key>` عند حفظ الروابط الدائمة.

## 10) استكشاف الأخطاء الشائعة

- "Unknown options: useEslintrc, extensions":
  - الحل: إزالة هذه الخيارات من إعدادات ESLint أو ضبط `next.config.js` لتعطيل الفحص أثناء البناء.
- خطأ TypeScript في مسارات TTS: توقيع `params` لا يطابق `Promise`:
  - الحل: عدّل توقيع الدالة ليستخدم `params: Promise<...>` وفق مواصفات Next.js 15.
- فشل رفع الصوت إلى Wasabi:
  - تحقق من القيم: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`، وصحّة `endpoint`.
- فشل دمج الصوت:
  - تأكد من توفر `ffmpeg-static` وأنّ البيئة تسمح بتنفيذ الثنائيات.

## 11) أنواع البيانات (مختصر)

- `StudioBlock`:
  - الحقول المتوقعة: `id`, `project_id`, `block_index`, `content`, `s3_url`, `created_at`
- `Voice`:
  - معرف، اسم العرض، اللغة/اللهجة، سمات صوتية (حسب مزوّد TTS)
- `Project`:
  - `id`, `title`, `user_id`, مجموعة من الكتل النصية

## 12) ختام

هذا الدليل يغطّي أهم مكوّنات المشروع وسير العمل الكامل من تحرير النص إلى الحصول على ملف صوتي نهائي. لأي تحسينات مستقبلية، يُنصح بالحفاظ على اتساق الأنواع (TypeScript)، مراجعة إعدادات ESLint دوريًا، وضبط سياسات الأمان (CSP) بما يتناسب مع نطاقات التخزين والبث المطلوبة.