# Stage 1: Builder
# استخدام صورة Node.js رسمية مستقرة
FROM node:18-alpine AS builder
WORKDIR /app

# نسخ ملفات تعريف المشروع والاعتماديات
COPY package.json package.json
COPY yarn.lock yarn.lock
# تثبيت الاعتماديات
RUN npm install --frozen-lockfile

# نسخ الكود المصدري
COPY . .

# متغيرات البيئة التي يتم تمريرها في وقت البناء (لضمان تضمينها في next build)
ARG NEXT_PUBLIC_HASURA_GRAPHQL_URL
ARG NEXT_PUBLIC_HASURA_ADMIN_SECRET

ENV NEXT_PUBLIC_HASURA_GRAPHQL_URL=$NEXT_PUBLIC_HASURA_GRAPHQL_URL
ENV NEXT_PUBLIC_HASURA_ADMIN_SECRET=$NEXT_PUBLIC_HASURA_ADMIN_SECRET

# بناء تطبيق Next.js مع إخراج standalone (مستقل)
RUN npm run build


# Stage 2: Runner
# استخدام صورة Alpine أصغر للإنتاج
FROM node:18-alpine AS runner
WORKDIR /app

# === تثبيت FFmpeg (ضروري لـ api/tts/merge-all) ===
# استخدام apk add --no-cache لتثبيت FFmpeg وتوفير المسار /usr/bin/ffmpeg
# وهو المسار الذي يحاول الكود استخدامه أولاً (كما تم تصحيحه في route.ts)
RUN apk add --no-cache ffmpeg

# === إعداد مستخدم غير جذري للأمان ===
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# نسخ ناتج البناء من المرحلة الأولى
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone .
# نسخ ملفات Static assets (CSS/JS)
COPY --from=builder /app/.next/static ./.next/static

# تعيين الملكية للمستخدم الجديد
# ومنح صلاحيات التنفيذ اللازمة
RUN chown -R nextjs:nodejs /app && chmod +x /usr/bin/ffmpeg

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

# أمر التشغيل الصحيح لإخراج standalone
CMD ["node", "server.js"]